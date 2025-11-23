import { storage, KnowledgeChunk } from './storage';

export interface KnowledgeChunk {
  id: string;
  file_id: string;
  chunk_index: number;
  chunk_text: string;
  keywords: string[];
  created_at: string;
}

export async function processFileIntoChunks(
  fileId: string,
  content: string,
  category: string,
  fileType: string
): Promise<void> {
  const chunks: KnowledgeChunk[] = [];

  const sections = content.split(/\n\n+/);
  let chunkIndex = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 20) continue;

    const keywords = extractKeywords(trimmed, category);

    chunks.push({
      id: `chunk-${fileId}-${chunkIndex}`,
      file_id: fileId,
      chunk_index: chunkIndex,
      chunk_text: trimmed,
      keywords,
      created_at: new Date().toISOString()
    });

    chunkIndex++;
  }

  if (chunks.length === 0) {
    const keywords = extractKeywords(content, category);
    chunks.push({
      id: `chunk-${fileId}-0`,
      file_id: fileId,
      chunk_index: 0,
      chunk_text: content.substring(0, 1000),
      keywords,
      created_at: new Date().toISOString()
    });
  }

  storage.saveChunks(chunks);
}

export async function deleteChunksForFile(fileId: string): Promise<void> {
  const allChunks = storage.getChunks();
  const remainingChunks = allChunks.filter(c => c.file_id !== fileId);
  localStorage.setItem('reunion_chunks', JSON.stringify(remainingChunks));
}

function extractKeywords(text: string, category: string): string[] {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  const keywords = words
    .filter(word => word.length > 3 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index);

  const topKeywords = keywords.slice(0, 10);

  topKeywords.push(category.toLowerCase());

  return topKeywords;
}
