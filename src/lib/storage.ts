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

export interface KnowledgeChunk {
  id: string;
  file_id: string;
  chunk_index: number;
  chunk_text: string;
  keywords: string[];
  created_at: string;
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

export interface AppCustomization {
  id: string;
  app_icon_url: string;
  app_name: string;
  welcome_message: string;
  google_maps_link: string;
  primary_contact_email: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

class LocalStorage {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getFiles(): KnowledgeBaseFile[] {
    return this.getItem('reunion_files', []);
  }

  saveFile(file: KnowledgeBaseFile): void {
    const files = this.getFiles();
    const index = files.findIndex(f => f.id === file.id);
    if (index >= 0) {
      files[index] = file;
    } else {
      files.push(file);
    }
    this.setItem('reunion_files', files);
  }

  deleteFile(id: string): void {
    const files = this.getFiles().filter(f => f.id !== id);
    this.setItem('reunion_files', files);

    const chunks = this.getChunks().filter(c => c.file_id !== id);
    this.setItem('reunion_chunks', chunks);
  }

  getChunks(): KnowledgeChunk[] {
    return this.getItem('reunion_chunks', []);
  }

  saveChunks(chunks: KnowledgeChunk[]): void {
    const existingChunks = this.getChunks();
    const updatedChunks = [...existingChunks];

    for (const chunk of chunks) {
      const index = updatedChunks.findIndex(c => c.id === chunk.id);
      if (index >= 0) {
        updatedChunks[index] = chunk;
      } else {
        updatedChunks.push(chunk);
      }
    }

    this.setItem('reunion_chunks', updatedChunks);
  }

  getCustomization(): AppCustomization {
    return this.getItem('app_customization', {
      id: '1',
      app_icon_url: '',
      app_name: 'Ti-Bot Reunion Assistant',
      welcome_message: 'Welcome! Ask me anything about the reunion.',
      google_maps_link: '',
      primary_contact_email: 'contact@reunion.com',
      updated_at: new Date().toISOString()
    });
  }

  saveCustomization(customization: AppCustomization): void {
    this.setItem('app_customization', customization);
  }

  getSessions(): ChatSession[] {
    return this.getItem('chat_sessions', []);
  }

  saveSession(session: ChatSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    this.setItem('chat_sessions', sessions);
  }

  getMessages(sessionId: string): ChatMessage[] {
    const allMessages = this.getItem<ChatMessage[]>('chat_messages', []);
    return allMessages.filter(m => m.session_id === sessionId);
  }

  saveMessage(message: ChatMessage): void {
    const messages = this.getItem<ChatMessage[]>('chat_messages', []);
    messages.push(message);
    this.setItem('chat_messages', messages);
  }

  getAdminUsers(): AdminUser[] {
    return this.getItem('admin_users', []);
  }

  saveAdminUser(user: AdminUser): void {
    const users = this.getAdminUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setItem('admin_users', users);
  }

  findAdminByEmail(email: string): AdminUser | null {
    const users = this.getAdminUsers();
    return users.find(u => u.email === email) || null;
  }

  initializeSampleData(): void {
    const files = this.getFiles();
    if (files.length === 0) {
      const sampleFile: KnowledgeBaseFile = {
        id: 'sample-1',
        file_name: 'Reunion_2026_Info.txt',
        file_type: 'text/plain',
        file_size: 250,
        file_content: `Reunion Information - May 21-24, 2026

Our annual family reunion will be held from May 21-24, 2026 at Lakeside Resort.

Schedule:
- May 21: Arrival and welcome dinner at 6 PM
- May 22: Lake activities and barbecue lunch
- May 23: Group photo at 10 AM, talent show at 7 PM
- May 24: Farewell breakfast and checkout by 11 AM

Location: Lakeside Resort, 123 Lake Drive, Watertown
Phone: (555) 123-4567
Email: info@lakesideresort.com

Accommodations: Rooms are reserved under "Family Reunion 2026"
Cost: $150 per night (includes breakfast)

What to bring: Comfortable clothes, swimwear, sunscreen, photos to share

RSVP by April 1, 2026 to contact@reunion.com`,
        description: 'Main reunion information document',
        category: 'general',
        keywords: ['reunion', '2026', 'may', 'lakeside', 'schedule', 'accommodation'],
        is_active: true,
        uploaded_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.saveFile(sampleFile);

      const sampleChunks: KnowledgeChunk[] = [
        {
          id: 'chunk-1',
          file_id: 'sample-1',
          chunk_index: 0,
          chunk_text: 'Our annual family reunion will be held from May 21-24, 2026 at Lakeside Resort.',
          keywords: ['reunion', '2026', 'may', 'lakeside', 'dates'],
          created_at: new Date().toISOString()
        },
        {
          id: 'chunk-2',
          file_id: 'sample-1',
          chunk_index: 1,
          chunk_text: 'Schedule: May 21: Arrival and welcome dinner at 6 PM. May 22: Lake activities and barbecue lunch. May 23: Group photo at 10 AM, talent show at 7 PM. May 24: Farewell breakfast and checkout by 11 AM',
          keywords: ['schedule', 'activities', 'dinner', 'photo', 'talent show'],
          created_at: new Date().toISOString()
        },
        {
          id: 'chunk-3',
          file_id: 'sample-1',
          chunk_index: 2,
          chunk_text: 'Location: Lakeside Resort, 123 Lake Drive, Watertown. Phone: (555) 123-4567. Email: info@lakesideresort.com',
          keywords: ['location', 'lakeside', 'resort', 'phone', 'email', 'contact'],
          created_at: new Date().toISOString()
        },
        {
          id: 'chunk-4',
          file_id: 'sample-1',
          chunk_index: 3,
          chunk_text: 'Accommodations: Rooms are reserved under "Family Reunion 2026". Cost: $150 per night (includes breakfast)',
          keywords: ['accommodation', 'rooms', 'cost', 'price', 'hotel'],
          created_at: new Date().toISOString()
        }
      ];

      this.saveChunks(sampleChunks);
    }

    const users = this.getAdminUsers();
    if (users.length === 0) {
      const defaultAdmin: AdminUser = {
        id: 'admin-1',
        email: 'admin@reunion.com',
        password_hash: 'admin123',
        created_at: new Date().toISOString()
      };
      this.saveAdminUser(defaultAdmin);
    }
  }
}

export const storage = new LocalStorage();
