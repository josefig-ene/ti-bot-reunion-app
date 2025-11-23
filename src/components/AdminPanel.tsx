import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, LogOut, Users, BookOpen, Settings as SettingsIcon, Home } from 'lucide-react';
import { supabase, AppCustomization, AdminUser, KnowledgeBaseFile } from '../lib/supabase';
import { getAdminUser, logoutAdmin, createAdminUser, updateAdminEmail, updateAdminPassword, deleteAdminUser } from '../lib/auth';
import { uploadFile, updateFile, deleteFile, getAllFiles, formatFileSize } from '../lib/fileUtils';

interface AdminPanelProps {
  onLogout: () => void;
  onBackToApp: () => void;
}

type TabType = 'files' | 'customization' | 'admins';

export default function AdminPanel({ onLogout, onBackToApp }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [customization, setCustomization] = useState<AppCustomization | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [editingFile, setEditingFile] = useState<Partial<KnowledgeBaseFile> | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  const [editingAdmin, setEditingAdmin] = useState<{ id: string; email: string; password: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newFileData, setNewFileData] = useState({ description: '', category: 'General', keywords: '' });
  const [chunksCount, setChunksCount] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const currentAdmin = getAdminUser();

  useEffect(() => {
    loadFiles();
    loadCustomization();
    loadAdmins();
    loadChunksCount();
  }, []);

  const loadChunksCount = async () => {
    const { count } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    setChunksCount(count ?? 0);
  };


  const loadCustomization = async () => {
    const { data } = await supabase
      .from('app_customization')
      .select('*')
      .single();

    if (data) {
      setCustomization(data);
    }
  };

  const loadAdmins = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('id, email, created_at');

    if (data) {
      setAdmins(data);
    }
  };

  const loadFiles = async () => {
    const data = await getAllFiles();
    setFiles(data);
  };



  const handleUpdateCustomization = async () => {
    if (!customization) return;

    const { error } = await supabase
      .from('app_customization')
      .update({
        app_name: customization.app_name,
        welcome_message: customization.welcome_message,
        google_maps_link: customization.google_maps_link,
        primary_contact_email: customization.primary_contact_email,
        updated_at: new Date().toISOString()
      })
      .eq('id', customization.id);

    if (!error) {
      alert('Settings updated successfully!');
      loadCustomization();
    } else {
      alert(`Error updating settings: ${error.message}`);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customization) return;

    setUploadingIcon(true);

    try {

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const { error } = await supabase
          .from('app_customization')
          .update({
            app_icon_url: base64,
            updated_at: new Date().toISOString()
          })
          .eq('id', customization.id);

        if (!error) {
          alert('Icon uploaded successfully!');
          loadCustomization();
        } else {
          alert(`Error uploading icon: ${error.message}`);
        }
        setUploadingIcon(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading icon:', error);
      alert('Error uploading icon. Please try again.');
      setUploadingIcon(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      alert('Email and password are required');
      return;
    }

    if (newAdmin.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    const result = await createAdminUser(
      newAdmin.email,
      newAdmin.password,
      currentAdmin?.id || ''
    );

    if (result.success) {
      alert('Admin user created successfully!');
      setNewAdmin({ email: '', password: '' });
      loadAdmins();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    if (!editingAdmin.email) {
      alert('Email is required');
      return;
    }

    const emailResult = await updateAdminEmail(editingAdmin.id, editingAdmin.email);
    if (!emailResult.success) {
      alert(`Error updating email: ${emailResult.error}`);
      return;
    }

    if (editingAdmin.password) {
      if (editingAdmin.password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
      const passwordResult = await updateAdminPassword(editingAdmin.id, editingAdmin.password);
      if (!passwordResult.success) {
        alert(`Error updating password: ${passwordResult.error}`);
        return;
      }
    }

    alert('Admin user updated successfully!');
    setEditingAdmin(null);
    loadAdmins();
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (currentAdmin?.id === adminId) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
      return;
    }

    const result = await deleteAdminUser(adminId);
    if (result.success) {
      alert('Admin user deleted successfully');
      loadAdmins();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    const keywords = newFileData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k);

    const result = await uploadFile(
      file,
      newFileData.description,
      newFileData.category,
      keywords,
      currentAdmin?.id || ''
    );

    if (result.success) {
      alert('File uploaded successfully!');
      setNewFileData({ description: '', category: 'General', keywords: '' });
      loadFiles();
      e.target.value = '';
    } else {
      alert(`Error: ${result.error}`);
    }

    setUploadingFile(false);
  };

  const handleUpdateFile = async () => {
    if (!editingFile?.id) return;

    let keywords: string[] = [];
    if (Array.isArray(editingFile.keywords)) {
      keywords = editingFile.keywords;
    } else if (editingFile.keywords && typeof editingFile.keywords === 'string') {
      const keywordsString = editingFile.keywords as string;
      keywords = keywordsString.split(',').map((k: string) => k.trim()).filter((k: string) => k);
    }

    const originalFile = files.find(f => f.id === editingFile.id);
    const categoryChanged = originalFile && originalFile.category !== editingFile.category;

    const result = await updateFile(editingFile.id, {
      description: editingFile.description || '',
      category: editingFile.category || 'General',
      keywords,
      is_active: editingFile.is_active ?? true
    });

    if (result.success) {
      if (categoryChanged && originalFile) {
        const { deleteChunksForFile, processFileIntoChunks } = await import('../lib/chunkProcessor');
        await deleteChunksForFile(editingFile.id);
        await processFileIntoChunks(
          editingFile.id,
          originalFile.file_content,
          editingFile.category || 'General',
          originalFile.file_type
        );
      }

      alert('File updated successfully!');
      setEditingFile(null);
      loadFiles();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    const result = await deleteFile(fileId);
    if (result.success) {
      alert('File deleted successfully');
      loadFiles();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{currentAdmin?.email}</span>
              </span>
              <button
                onClick={onBackToApp}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to App
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'files'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'customization'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Customization
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'admins'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Users className="w-5 h-5" />
            Admin Users
          </button>
        </div>


        {activeTab === 'files' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {chunksCount === 0 && files.length > 0 && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">Action Required</h3>
                    <p className="mt-1 text-sm text-orange-700">
                      After security updates, knowledge chunks need to be regenerated. Click "Regenerate All Chunks" to process all files and enable chatbot responses.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Knowledge Base</h2>
              <button
                onClick={async () => {
                  if (!confirm('This will regenerate all knowledge chunks with embeddings. This may take a few minutes. Continue?')) return;
                  setRegenerating(true);
                  try {
                    const { regenerateAllChunks } = await import('../lib/migrationHelper');
                    const result = await regenerateAllChunks();
                    if (result.success) {
                      alert(`Successfully processed ${result.processed} files and generated chunks with embeddings!`);
                      loadFiles();
                      loadChunksCount();
                    } else {
                      alert(`Error: ${result.error}`);
                    }
                  } finally {
                    setRegenerating(false);
                  }
                }}
                disabled={regenerating}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {regenerating && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {regenerating ? 'Regenerating...' : 'Regenerate All Chunks'}
              </button>
            </div>

            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Upload New File</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File (Max 10MB - PDF, TXT, Excel, CSV, etc.)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={uploadingFile}
                    accept=".pdf,.txt,.doc,.docx,.md,.json,.xlsx,.xls,.csv"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newFileData.description}
                    onChange={(e) => setNewFileData({ ...newFileData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Brief description of the file..."
                    disabled={uploadingFile}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newFileData.category}
                      onChange={(e) => setNewFileData({ ...newFileData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="General"
                      disabled={uploadingFile}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newFileData.keywords}
                      onChange={(e) => setNewFileData({ ...newFileData, keywords: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="schedule, map, rules"
                      disabled={uploadingFile}
                    />
                  </div>
                </div>
                {uploadingFile && (
                  <p className="text-sm text-orange-600 font-medium">Uploading file...</p>
                )}
              </div>
            </div>

            {editingFile && (
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-semibold mb-4">Edit File Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={editingFile.file_name || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editingFile.description || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={editingFile.category || ''}
                        onChange={(e) => setEditingFile({ ...editingFile, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(editingFile.keywords) ? editingFile.keywords.join(', ') : editingFile.keywords || ''}
                        onChange={(e) => setEditingFile({ ...editingFile, keywords: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={editingFile.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setEditingFile({ ...editingFile, is_active: e.target.value === 'active' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateFile}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Update File
                    </button>
                    <button
                      onClick={() => setEditingFile(null)}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Files</h3>
              {files.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No files uploaded yet</p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{file.file_name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            file.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {file.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {file.category}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {formatFileSize(file.file_size)}
                          </span>
                        </div>
                        {file.description && (
                          <p className="text-sm text-gray-600 mb-2">{file.description}</p>
                        )}
                        {file.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {file.keywords.map((keyword, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Uploaded: {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingFile(file)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit File"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'customization' && customization && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">App Customization</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Icon
                </label>
                <div className="flex items-center gap-4">
                  {customization.app_icon_url && (
                    <img
                      src={customization.app_icon_url}
                      alt="App Icon"
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                      id="icon-upload"
                      disabled={uploadingIcon}
                    />
                    <label
                      htmlFor="icon-upload"
                      className={`flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer ${
                        uploadingIcon ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingIcon ? 'Uploading...' : 'Upload Icon'}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  value={customization.app_name}
                  onChange={(e) => setCustomization({ ...customization, app_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={customization.welcome_message}
                  onChange={(e) => setCustomization({ ...customization, welcome_message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps Link (Campus Map)
                </label>
                <input
                  type="text"
                  value={customization.google_maps_link}
                  onChange={(e) => setCustomization({ ...customization, google_maps_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This map will be shown when users ask location-related questions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  value={customization.primary_contact_email}
                  onChange={(e) => setCustomization({ ...customization, primary_contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={handleUpdateCustomization}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save Customization
              </button>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Users</h2>

            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Add New Admin User</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                onClick={handleAddAdmin}
                className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Admin User
              </button>
            </div>

            {editingAdmin && (
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-semibold mb-4">Edit Admin User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingAdmin.email}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={editingAdmin.password}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateAdmin}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Update Admin
                    </button>
                    <button
                      onClick={() => setEditingAdmin(null)}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Admin Users</h3>
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{admin.email}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(admin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentAdmin?.id === admin.id && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        You
                      </span>
                    )}
                    <button
                      onClick={() => setEditingAdmin({ id: admin.id, email: admin.email, password: '' })}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Admin"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Admin"
                      disabled={currentAdmin?.id === admin.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
