import { supabase } from './supabase';

export interface KnowledgeChunk {
  id?: string;
  file_id: string;
  chunk_type: 'qa' | 'section' | 'table';
  question?: string;
  answer: string;
  context?: string;
  category: string;
  keywords: string[];
  source_location?: string;
  is_active: boolean;
  embedding?: number[];
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('Failed to generate embedding:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

export async function processFileIntoChunks(
  fileId: string,
  content: string,
  category: string,
  fileType: string
): Promise<void> {
  console.log(`Processing file ${fileId}, content length: ${content.length}, type: ${fileType}`);

  const chunks: KnowledgeChunk[] = [];

  if (fileType.includes('json')) {
    chunks.push(...extractFromJSON(fileId, content, category));
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    chunks.push(...extractFromSpreadsheet(fileId, content, category));
  } else {
    chunks.push(...extractFromText(fileId, content, category));
  }

  console.log(`Extracted ${chunks.length} chunks from file ${fileId}`);

  if (chunks.length > 0) {
    for (const chunk of chunks) {
      const embeddingText = chunk.question
        ? `${chunk.question} ${chunk.answer}`
        : chunk.answer;

      console.log(`Generating embedding for chunk: ${embeddingText.substring(0, 50)}...`);
      const embedding = await generateEmbedding(embeddingText);
      if (embedding) {
        chunk.embedding = embedding;
        console.log(`Embedding generated successfully, dimensions: ${embedding.length}`);
      } else {
        console.warn(`Failed to generate embedding for chunk`);
      }
    }

    const { error } = await supabase
      .from('knowledge_chunks')
      .insert(chunks);

    if (error) {
      console.error('Error inserting chunks:', error);
      throw error;
    }

    console.log(`Successfully inserted ${chunks.length} chunks`);
  } else {
    console.warn(`No chunks extracted from file ${fileId}`);
  }
}

function extractFromText(fileId: string, content: string, category: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const trimmedContent = content.trim();

  if (trimmedContent.length < 10) {
    console.warn(`Content too short (${trimmedContent.length} chars), skipping`);
    return chunks;
  }

  const lines = content.split('\n');

  let currentSection: string[] = [];
  let currentQuestion: string | null = null;
  let sectionStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentSection.length > 0) {
        if (currentQuestion) {
          chunks.push({
            file_id: fileId,
            chunk_type: 'qa',
            question: currentQuestion,
            answer: currentSection.join('\n').trim(),
            category,
            keywords: extractKeywords(currentQuestion + ' ' + currentSection.join(' ')),
            source_location: `lines ${sectionStart}-${i}`,
            is_active: true
          });
          currentQuestion = null;
        } else {
          const sectionText = currentSection.join('\n').trim();
          if (sectionText.length >= 10) {
            chunks.push({
              file_id: fileId,
              chunk_type: 'section',
              answer: sectionText,
              category,
              keywords: extractKeywords(sectionText),
              source_location: `lines ${sectionStart}-${i}`,
              is_active: true
            });
          }
        }
        currentSection = [];
      }
      continue;
    }

    if (line.startsWith('Q:') || line.match(/^Q\d+[:\.]/) || line.endsWith('?')) {
      if (currentSection.length > 0 && currentQuestion) {
        chunks.push({
          file_id: fileId,
          chunk_type: 'qa',
          question: currentQuestion,
          answer: currentSection.join('\n').trim(),
          category,
          keywords: extractKeywords(currentQuestion + ' ' + currentSection.join(' ')),
          source_location: `lines ${sectionStart}-${i-1}`,
          is_active: true
        });
      } else if (currentSection.length > 0) {
        const sectionText = currentSection.join('\n').trim();
        if (sectionText.length >= 10) {
          chunks.push({
            file_id: fileId,
            chunk_type: 'section',
            answer: sectionText,
            category,
            keywords: extractKeywords(sectionText),
            source_location: `lines ${sectionStart}-${i-1}`,
            is_active: true
          });
        }
      }

      currentQuestion = line.replace(/^Q\d*[:\.]?\s*/i, '').trim();
      currentSection = [];
      sectionStart = i;
    } else if (line.startsWith('A:') || line.match(/^A\d+[:\.]/) && currentQuestion) {
      currentSection.push(line.replace(/^A\d*[:\.]?\s*/i, '').trim());
    } else {
      if (currentSection.length === 0) {
        sectionStart = i;
      }
      currentSection.push(line);
    }
  }

  if (currentSection.length > 0) {
    if (currentQuestion) {
      chunks.push({
        file_id: fileId,
        chunk_type: 'qa',
        question: currentQuestion,
        answer: currentSection.join('\n').trim(),
        category,
        keywords: extractKeywords(currentQuestion + ' ' + currentSection.join(' ')),
        source_location: `lines ${sectionStart}-${lines.length}`,
        is_active: true
      });
    } else {
      const sectionText = currentSection.join('\n').trim();
      if (sectionText.length >= 10) {
        chunks.push({
          file_id: fileId,
          chunk_type: 'section',
          answer: sectionText,
          category,
          keywords: extractKeywords(sectionText),
          source_location: `lines ${sectionStart}-${lines.length}`,
          is_active: true
        });
      }
    }
  }

  if (chunks.length === 0 && trimmedContent.length >= 10) {
    chunks.push({
      file_id: fileId,
      chunk_type: 'section',
      answer: trimmedContent,
      category,
      keywords: extractKeywords(trimmedContent),
      source_location: 'full content',
      is_active: true
    });
  }

  return chunks;
}

function extractFromJSON(fileId: string, content: string, category: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  try {
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item.question && item.answer) {
          chunks.push({
            file_id: fileId,
            chunk_type: 'qa',
            question: item.question,
            answer: item.answer,
            category: item.category || category,
            keywords: extractKeywords(item.question + ' ' + item.answer),
            source_location: `item ${index}`,
            is_active: true
          });
        }
      });
    } else if (data.faqs && Array.isArray(data.faqs)) {
      data.faqs.forEach((faq: any, index: number) => {
        if (faq.question && faq.answer) {
          chunks.push({
            file_id: fileId,
            chunk_type: 'qa',
            question: faq.question,
            answer: faq.answer,
            category: faq.category || category,
            keywords: extractKeywords(faq.question + ' ' + faq.answer),
            source_location: `faq ${index}`,
            is_active: true
          });
        }
      });
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }

  return chunks;
}

function extractFromSpreadsheet(fileId: string, content: string, category: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const lines = content.split('\n');

  if (lines.length < 2) return chunks;

  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  const questionIdx = headers.findIndex(h => h.includes('question') || h === 'q');
  const answerIdx = headers.findIndex(h => h.includes('answer') || h === 'a');

  if (questionIdx !== -1 && answerIdx !== -1) {
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split('\t');
      const question = cells[questionIdx]?.trim();
      const answer = cells[answerIdx]?.trim();

      if (question && answer) {
        chunks.push({
          file_id: fileId,
          chunk_type: 'qa',
          question,
          answer,
          category,
          keywords: extractKeywords(question + ' ' + answer),
          source_location: `row ${i + 1}`,
          is_active: true
        });
      }
    }
  } else {
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split('\t');
      const content = cells.join(' ').trim();

      if (content.length > 20) {
        chunks.push({
          file_id: fileId,
          chunk_type: 'table',
          answer: content,
          category,
          keywords: extractKeywords(content),
          source_location: `row ${i + 1}`,
          is_active: true
        });
      }
    }
  }

  return chunks;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const uniqueWords = [...new Set(words)];
  return uniqueWords.slice(0, 20);
}

export async function deleteChunksForFile(fileId: string): Promise<void> {
  await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('file_id', fileId);
}
