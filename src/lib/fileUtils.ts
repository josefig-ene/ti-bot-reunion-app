import { storage, KnowledgeBaseFile } from './storage';
import * as XLSX from 'xlsx';
import { processFileIntoChunks, deleteChunksForFile } from './chunkProcessor';

export async function getAllFiles(): Promise<KnowledgeBaseFile[]> {
  return storage.getFiles();
}

export async function uploadFile(
  file: File,
  description: string,
  category: string,
  keywords: string[],
  uploadedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileContent = await readFileContent(file);

    const newFile: KnowledgeBaseFile = {
      id: `file-${Date.now()}`,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_content: fileContent,
      description,
      category,
      keywords,
      is_active: true,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveFile(newFile);

    await processFileIntoChunks(newFile.id, fileContent, category, file.type);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

export async function updateFile(
  fileId: string,
  updates: { description?: string; category?: string; keywords?: string[]; is_active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const files = storage.getFiles();
    const file = files.find(f => f.id === fileId);

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    const updatedFile = {
      ...file,
      ...updates,
      updated_at: new Date().toISOString()
    };

    storage.saveFile(updatedFile);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
  }
}

export async function deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteChunksForFile(fileId);
    storage.deleteFile(fileId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
}

async function readFileContent(file: File): Promise<string> {
  const fileType = file.type;

  if (fileType === 'text/plain' || fileType === 'text/markdown') {
    return await file.text();
  }

  if (fileType === 'application/pdf') {
    return await extractTextFromPDF(file);
  }

  if (
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    fileType === 'application/vnd.ms-excel'
  ) {
    return await extractTextFromExcel(file);
  }

  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return await file.text();
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

async function extractTextFromExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  let fullText = '';
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const sheetText = XLSX.utils.sheet_to_txt(worksheet);
    fullText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
  });

  return fullText;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
