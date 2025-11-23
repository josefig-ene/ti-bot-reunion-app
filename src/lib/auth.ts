import { supabase } from './supabase';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Invalid email or password' };
    }

    localStorage.setItem('admin_user', JSON.stringify(data));
    return { success: true, userId: data.id };
  } catch (error) {
    return { success: false, error: 'Login failed' };
  }
}

export async function createAdminUser(email: string, password: string, createdBy: string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(password);

    const { error } = await supabase
      .from('admin_users')
      .insert({
        email,
        password_hash: passwordHash,
        created_by: createdBy
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create admin user' };
  }
}

export function getAdminUser(): { id: string; email: string } | null {
  const stored = localStorage.getItem('admin_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem('admin_user');
}

export function isAdminLoggedIn(): boolean {
  return getAdminUser() !== null;
}

export async function updateAdminEmail(adminId: string, newEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ email: newEmail })
      .eq('id', adminId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update email' };
  }
}

export async function updateAdminPassword(adminId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('id', adminId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update password' };
  }
}

export async function deleteAdminUser(adminId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete admin user' };
  }
}

function generateResetToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const { data: adminExists } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (!adminExists) {
      return { success: false, error: 'No admin account found with this email' };
    }

    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error } = await supabase
      .from('password_reset_tokens')
      .insert({
        admin_email: email,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, token: resetToken };
  } catch (error) {
    return { success: false, error: 'Failed to create reset token' };
  }
}

export async function validateResetToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('admin_email, expires_at, used')
      .eq('reset_token', token)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Invalid reset token' };
    }

    if (data.used) {
      return { success: false, error: 'This reset token has already been used' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { success: false, error: 'Reset token has expired' };
    }

    return { success: true, email: data.admin_email };
  } catch (error) {
    return { success: false, error: 'Failed to validate token' };
  }
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = await validateResetToken(token);
    if (!validation.success || !validation.email) {
      return { success: false, error: validation.error };
    }

    const passwordHash = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('email', validation.email);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('reset_token', token);

    if (tokenError) {
      console.error('Failed to mark token as used:', tokenError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reset password' };
  }
}
