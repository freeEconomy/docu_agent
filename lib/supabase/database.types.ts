// Schema contract for supabase/migrations/202610180001_documind.sql.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};
type DocumentRow = {
  id: string;
  user_id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  storage_path: string;
  category: string;
  status: string;
  chunk_count: number;
  page_count: number;
  extracted_text: string;
  error_message: string | null;
  processing_token: string | null;
  processing_started_at: string | null;
  created_at: string;
};
type ChunkRow = {
  id: string;
  user_id: string;
  document_id: string;
  position: number;
  content: string;
  search_vector: unknown;
};
type ConversationRow = { id: string; user_id: string; title: string; created_at: string };
type TurnRow = {
  id: string;
  user_id: string;
  conversation_id: string;
  question: string;
  answer: string;
  citations: Json;
  mode: string;
  created_at: string;
};
export type Database = {
  public: {
    Tables: {
      documents: Table<DocumentRow, 'name' | 'file_type' | 'size_bytes' | 'storage_path'>;
      document_chunks: Table<ChunkRow, 'document_id' | 'position' | 'content'>;
      conversations: Table<ConversationRow, 'title'>;
      chat_turns: Table<TurnRow, 'conversation_id' | 'question' | 'answer' | 'mode'>;
    };
    Views: Record<string, never>;
    Functions: {
      begin_document_processing: { Args: { doc_id: string }; Returns: string };
      finish_document_processing: {
        Args: {
          doc_id: string;
          token: string;
          body: string;
          pages: number;
          parts: string[];
          failure?: string;
        };
        Returns: undefined;
      };
      search_document_chunks: {
        Args: { query_text: string; selected_ids: string[] | null };
        Returns: {
          chunk_id: string;
          document_id: string;
          document_name: string;
          position: number;
          content: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
