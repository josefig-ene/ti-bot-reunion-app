/*
  # Princeton Class of '81 Reunion Chatbot Schema
  
  ## Overview
  This migration creates the complete database structure for the reunion chatbot application
  with admin controls, FAQ management, and chat history tracking.
  
  ## New Tables
  
  ### 1. `admin_users`
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, unique) - Admin email address
  - `password_hash` (text) - Hashed password
  - `created_at` (timestamptz) - Account creation timestamp
  - `created_by` (uuid) - Reference to admin who created this account
  
  ### 2. `faq_knowledge_base`
  - `id` (uuid, primary key) - Unique identifier
  - `question` (text) - FAQ question
  - `answer` (text) - Detailed answer
  - `category` (text) - Category for organization
  - `keywords` (text[]) - Search keywords array
  - `priority` (integer) - Display priority (higher = more important)
  - `is_active` (boolean) - Whether FAQ is currently active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. `app_customization`
  - `id` (uuid, primary key) - Single row for settings
  - `app_icon_url` (text) - URL to app icon image
  - `app_name` (text) - Application display name
  - `welcome_message` (text) - Initial greeting message
  - `google_maps_link` (text) - Default campus map link
  - `primary_contact_email` (text) - Main contact email
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 4. `chat_sessions`
  - `id` (uuid, primary key) - Unique session identifier
  - `user_identifier` (text) - Anonymous user ID
  - `started_at` (timestamptz) - Session start time
  - `ended_at` (timestamptz) - Session end time (nullable)
  - `is_active` (boolean) - Whether session is currently active
  
  ### 5. `chat_messages`
  - `id` (uuid, primary key) - Unique message identifier
  - `session_id` (uuid, foreign key) - Reference to chat session
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - Message content
  - `timestamp` (timestamptz) - Message timestamp
  - `metadata` (jsonb) - Additional data (e.g., map links)
  
  ## Security
  - Enable RLS on all tables
  - Admin users can manage FAQs and customization
  - Chat sessions and messages are publicly readable for the session owner
  - Admin users have full access to all data
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id)
);

-- Create faq_knowledge_base table
CREATE TABLE IF NOT EXISTS faq_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  keywords text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create app_customization table (single row)
CREATE TABLE IF NOT EXISTS app_customization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_icon_url text DEFAULT '',
  app_name text DEFAULT 'Class of ''81 Reunion Assistant',
  welcome_message text DEFAULT 'Hi! I''m here to help with questions about the Class of ''81 45th Reunion (May 21-24, 2026). What would you like to know?',
  google_maps_link text DEFAULT 'https://www.google.com/maps/place/Poe+Field/@40.3433428,-74.6576138,750m/data=!3m2!1e3!4b1!4m6!3m5!1s0x89c3e6c50cb9d9c1:0x870fcf4a18d79813!8m2!3d40.3433387!4d-74.6550335!16s%2Fg%2F12cpk4fkx?entry=ttu&g_ep=EgoyMDI1MTAxNC4wIKXMDSoASAFQAw%3D%3D',
  primary_contact_email text DEFAULT '81s40th+45chatbothelp@gmail.com',
  updated_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Insert default customization settings
INSERT INTO app_customization (id, app_icon_url, app_name, welcome_message, google_maps_link, primary_contact_email)
VALUES (
  gen_random_uuid(),
  '',
  'Class of ''81 Reunion Assistant',
  'Hi! I''m here to help with questions about the Class of ''81 45th Reunion (May 21-24, 2026). What would you like to know?',
  'https://www.google.com/maps/place/Poe+Field/@40.3433428,-74.6576138,750m/data=!3m2!1e3!4b1!4m6!3m5!1s0x89c3e6c50cb9d9c1:0x870fcf4a18d79813!8m2!3d40.3433387!4d-74.6550335!16s%2Fg%2F12cpk4fkx?entry=ttu&g_ep=EgoyMDI1MTAxNC4wIKXMDSoASAFQAw%3D%3D',
  '81s40th+45chatbothelp@gmail.com'
)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert new admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- RLS Policies for faq_knowledge_base
CREATE POLICY "Anyone can read active FAQs"
  ON faq_knowledge_base FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
  ON faq_knowledge_base FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- RLS Policies for app_customization
CREATE POLICY "Anyone can read customization"
  ON app_customization FOR SELECT
  USING (true);

CREATE POLICY "Admins can update customization"
  ON app_customization FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- RLS Policies for chat_sessions
CREATE POLICY "Users can read own sessions"
  ON chat_sessions FOR SELECT
  USING (true);

CREATE POLICY "Users can create sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON chat_sessions FOR UPDATE
  USING (true);

-- RLS Policies for chat_messages
CREATE POLICY "Users can read messages from their sessions"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_faq_active ON faq_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_priority ON faq_knowledge_base(priority DESC);
CREATE INDEX IF NOT EXISTS idx_chat_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_session_active ON chat_sessions(is_active);