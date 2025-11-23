import { supabase } from './supabase';
import { processFileIntoChunks } from './chunkProcessor';

export async function regenerateAllChunks(): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    await supabase
      .from('knowledge_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: files, error: fetchError } = await supabase
      .from('knowledge_base_files')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      return { success: false, processed: 0, error: fetchError.message };
    }

    if (!files || files.length === 0) {
      return { success: true, processed: 0 };
    }

    for (const file of files) {
      await processFileIntoChunks(
        file.id,
        file.file_content,
        file.category,
        file.file_type
      );
    }

    return { success: true, processed: files.length };
  } catch (error) {
    console.error('Error regenerating chunks:', error);
    return { success: false, processed: 0, error: 'Failed to regenerate chunks' };
  }
}
