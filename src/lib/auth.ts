import { storage } from './storage';

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
    const user = storage.findAdminByEmail(email);

    if (!user || user.password_hash !== passwordHash) {
      return { success: false, error: 'Invalid email or password' };
    }

    localStorage.setItem('admin_user', JSON.stringify({ id: user.id, email: user.email }));
    return { success: true, userId: user.id };
  } catch (error) {
    return { success: false, error: 'Login failed' };
  }
}

export async function createAdminUser(email: string, password: string, createdBy: string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(password);

    const existing = storage.findAdminByEmail(email);
    if (existing) {
      return { success: false, error: 'User already exists' };
    }

    const newUser = {
      id: `admin-${Date.now()}`,
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    };

    storage.saveAdminUser(newUser);
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
    const users = storage.getAdminUsers();
    const user = users.find(u => u.id === adminId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.email = newEmail;
    storage.saveAdminUser(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update email' };
  }
}

export async function updateAdminPassword(adminId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(newPassword);
    const users = storage.getAdminUsers();
    const user = users.find(u => u.id === adminId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.password_hash = passwordHash;
    storage.saveAdminUser(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update password' };
  }
}

export async function deleteAdminUser(adminId: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented in local storage mode' };
}

function generateResetToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = storage.findAdminByEmail(email);

  if (!user) {
    return { success: false, error: 'No admin account found with this email' };
  }

  const resetToken = generateResetToken();
  console.log(`Password reset token for ${email}: ${resetToken}`);

  return { success: true, token: resetToken };
}

export async function validateResetToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  return { success: false, error: 'Password reset not fully implemented in local storage mode' };
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Password reset not fully implemented in local storage mode' };
}
