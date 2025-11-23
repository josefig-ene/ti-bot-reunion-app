import { supabase, KnowledgeBaseFile } from './supabase';
import * as XLSX from 'xlsx';
import { processFileIntoChunks, deleteChunksForFile } from './chunkProcessor';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function initPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

export async function uploadFile(
  file: File,
  description: string,
  category: string,
  keywords: string[],
  uploadedBy: string
): Promise<{ success: boolean; error?: string; fileId?: string }> {
  try {
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 10MB' };
    }


    const fileContent = await readFileAsText(file);

    const { data, error } = await supabase
      .from('knowledge_base_files')
      .insert({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_content: fileContent,
        description,
        category,
        keywords,
        is_active: true,
        uploaded_by: uploadedBy
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await processFileIntoChunks(data.id, fileContent, category, file.type);

    return { success: true, fileId: data.id };
  } catch (error) {
    return { success: false, error: 'Failed to upload file' };
  }
}

export async function updateFile(
  fileId: string,
  updates: {
    description?: string;
    category?: string;
    keywords?: string[];
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('knowledge_base_files')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update file' };
  }
}

export async function deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteChunksForFile(fileId);

    const { error } = await supabase
      .from('knowledge_base_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete file' };
  }
}

export async function getAllFiles(): Promise<KnowledgeBaseFile[]> {
  const { data } = await supabase
    .from('knowledge_base_files')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

async function readFileAsText(file: File): Promise<string> {
  const isSpreadsheet =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls') ||
    file.name.endsWith('.csv');

  const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');

  if (isSpreadsheet) {
    return readSpreadsheetAsText(file);
  }

  if (isPDF) {
    return readPDFAsText(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

async function readSpreadsheetAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        let textContent = '';

        workbook.SheetNames.forEach((sheetName, index) => {
          const worksheet = workbook.Sheets[sheetName];

          if (index > 0) {
            textContent += '\n\n';
          }

          textContent += `=== ${sheetName} ===\n\n`;

          const csvContent = XLSX.utils.sheet_to_csv(worksheet, {
            FS: '\t',
            RS: '\n'
          });

          textContent += csvContent;
        });

        resolve(textContent);
      } catch (error) {
        reject(new Error('Failed to parse spreadsheet'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read spreadsheet file'));
    reader.readAsArrayBuffer(file);
  });
}

async function readPDFAsText(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const pdfjs = await initPdfJs();
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjs.getDocument({ data: typedArray }).promise;

        let textContent = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();

          const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');

          textContent += pageText + '\n\n';
        }

        resolve(textContent.trim());
      } catch (error) {
        reject(new Error('Failed to parse PDF'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
