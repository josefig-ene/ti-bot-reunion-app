import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppCustomization {
  id: string;
  app_icon_url: string;
  app_name: string;
  welcome_message: string;
  google_maps_link: string;
  primary_contact_email: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_identifier: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface KnowledgeBaseFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_content: string;
  description: string | null;
  category: string;
  keywords: string[];
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}
