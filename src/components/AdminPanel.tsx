import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, LogOut, BookOpen, Settings as SettingsIcon, Home } from 'lucide-react';
import { storage, AppCustomization, KnowledgeBaseFile } from '../lib/storage';
import { getAdminUser, logoutAdmin } from '../lib/auth';
import { uploadFile, updateFile, deleteFile, getAllFiles, formatFileSize } from '../lib/fileUtils';

interface AdminPanelProps {
  onLogout: () => void;
  onBackToApp: () => void;
}

type TabType = 'files' | 'customization';

export default function AdminPanel({ onLogout, onBackToApp }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [customization, setCustomization] = useState<AppCustomization | null>(null);
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [editingFile, setEditingFile] = useState<Partial<KnowledgeBaseFile> | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newFileData, setNewFileData] = useState({ description: '', category: 'General', keywords: '' });
  const currentAdmin = getAdminUser();

  useEffect(() => {
    loadFiles();
    loadCustomization();
  }, []);

  const loadCustomization = () => {
    const data = storage.getCustomization();
    setCustomization(data);
  };

  const loadFiles = async () => {
    const data = await getAllFiles();
    setFiles(data);
  };

  const handleUpdateCustomization = () => {
    if (!customization) return;

    const updated = {
      ...customization,
      updated_at: new Date().toISOString()
    };

    storage.saveCustomization(updated);
    alert('Settings updated successfully!');
    loadCustomization();
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

    const result = await updateFile(editingFile.id, {
      description: editingFile.description || '',
      category: editingFile.category || 'General',
      keywords,
      is_active: editingFile.is_active ?? true
    });

    if (result.success) {
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToApp}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to App
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'files'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Knowledge Base Files ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('customization')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'customization'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              App Settings
            </button>
          </div>
        </div>

        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New File
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.pdf,.xlsx,.xls,.doc,.docx"
                    disabled={uploadingFile}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Supported formats: TXT, PDF, Excel, Word
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newFileData.description}
                    onChange={(e) => setNewFileData({ ...newFileData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Brief description of the file contents..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newFileData.category}
                      onChange={(e) => setNewFileData({ ...newFileData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="General">General</option>
                      <option value="Schedule">Schedule</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Activities">Activities</option>
                      <option value="FAQ">FAQ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newFileData.keywords}
                      onChange={(e) => setNewFileData({ ...newFileData, keywords: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="reunion, schedule, hotel"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Files
              </h2>
              <div className="space-y-3">
                {files.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No files uploaded yet. Upload your first file to get started.
                  </p>
                ) : (
                  files.map((file) => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {editingFile?.id === file.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={editingFile.description || ''}
                              onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                              </label>
                              <select
                                value={editingFile.category || 'General'}
                                onChange={(e) => setEditingFile({ ...editingFile, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="General">General</option>
                                <option value="Schedule">Schedule</option>
                                <option value="Accommodation">Accommodation</option>
                                <option value="Activities">Activities</option>
                                <option value="FAQ">FAQ</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keywords
                              </label>
                              <input
                                type="text"
                                value={Array.isArray(editingFile.keywords) ? editingFile.keywords.join(', ') : editingFile.keywords || ''}
                                onChange={(e) => setEditingFile({ ...editingFile, keywords: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={editingFile.is_active ?? true}
                                onChange={(e) => setEditingFile({ ...editingFile, is_active: e.target.checked })}
                                className="rounded"
                              />
                              Active
                            </label>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateFile}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFile(null)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{file.file_name}</h3>
                              <p className="text-sm text-gray-600">{file.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingFile(file)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              {file.category}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {formatFileSize(file.file_size)}
                            </span>
                            <span className={`px-2 py-1 rounded ${file.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {file.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {file.keywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {file.keywords.map((keyword, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customization' && customization && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">App Customization</h2>
            <div className="space-y-6">
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
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={customization.google_maps_link}
                  onChange={(e) => setCustomization({ ...customization, google_maps_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://maps.google.com/..."
                />
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
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
