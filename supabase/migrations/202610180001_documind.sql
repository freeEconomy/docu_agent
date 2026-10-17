-- Run once in the project's Supabase SQL Editor. No example/seed data is inserted.
begin;
create extension if not exists pg_trgm with schema extensions;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  file_type text not null check (file_type in ('PDF','DOCX','HWPX','TXT','MD','MARKDOWN')),
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  storage_path text not null unique,
  category text not null default '미분류' check (char_length(category) between 1 and 80),
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  chunk_count integer not null default 0 check (chunk_count >= 0),
  page_count integer not null default 0 check (page_count >= 0),
  extracted_text text not null default '',
  error_message text,
  processing_token uuid,
  processing_started_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id, user_id),
  check (storage_path = user_id::text || '/' || id::text || '/original.' || lower(file_type))
);
create index documents_user_created on public.documents(user_id, created_at desc);
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null default auth.uid(),
  position integer not null check (position >= 0),
  content text not null check (char_length(content) between 1 and 1200),
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  foreign key(document_id, user_id) references public.documents(id, user_id) on delete cascade,
  unique(document_id, position)
);
create index chunks_user on public.document_chunks(user_id);
create index chunks_search on public.document_chunks using gin(search_vector);
create index chunks_trigram on public.document_chunks using gin(content extensions.gin_trgm_ops);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  unique(id, user_id)
);
create index conversations_user on public.conversations(user_id, created_at desc);
create table public.chat_turns (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null default auth.uid(),
  question text not null check (char_length(question) between 1 and 2000),
  answer text not null check (char_length(answer) <= 30000),
  citations jsonb not null default '[]'::jsonb check (jsonb_typeof(citations) = 'array'),
  mode text not null check (mode in ('extractive','generated','no_match')),
  created_at timestamptz not null default now(),
  foreign key(conversation_id, user_id) references public.conversations(id, user_id) on delete cascade
);
create index turns_user_created on public.chat_turns(user_id, created_at desc);
create index turns_conversation on public.chat_turns(conversation_id, created_at);

alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_turns enable row level security;
create policy documents_owner on public.documents to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy chunks_owner on public.document_chunks to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy conversations_owner on public.conversations to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy turns_owner on public.chat_turns to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.documents, public.document_chunks, public.conversations, public.chat_turns from anon;
grant select, insert, update, delete on public.documents, public.document_chunks, public.conversations, public.chat_turns to authenticated;

insert into storage.buckets(id, name, public, file_size_limit)
values ('documents', 'documents', false, 20971520)
on conflict(id) do update set public = false, file_size_limit = excluded.file_size_limit;
create policy documind_storage_read on storage.objects for select to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy documind_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy documind_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Claims expire after five minutes, allowing retries after a terminated server invocation.
create function public.begin_document_processing(doc_id uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare token uuid := gen_random_uuid();
begin
  update documents set processing_token = token, processing_started_at = now(), status = 'processing', error_message = null
  where id = doc_id and user_id = auth.uid()
    and (processing_started_at is null or processing_started_at < now() - interval '5 minutes');
  if not found then raise exception 'Document unavailable or already processing'; end if;
  return token;
end;
$$;
-- Replaces chunks and status together. Failed reindexing can never expose partial chunks.
create function public.finish_document_processing(doc_id uuid, token uuid, body text, pages integer, parts text[], failure text default null) returns void
language plpgsql security invoker set search_path = public as $$
begin
  perform 1 from documents where id = doc_id and user_id = auth.uid() and processing_token = token for update;
  if not found then raise exception 'Processing claim expired'; end if;
  if failure is not null then
    update documents set status = 'failed', error_message = left(failure, 500), processing_token = null, processing_started_at = null where id = doc_id and user_id = auth.uid();
    return;
  end if;
  if char_length(body) > 400000 or cardinality(parts) not between 1 and 500 then raise exception 'Invalid text/chunk limits'; end if;
  delete from document_chunks where document_id = doc_id and user_id = auth.uid();
  insert into document_chunks(document_id, user_id, position, content)
    select doc_id, auth.uid(), ordinality::integer - 1, value from unnest(parts) with ordinality as p(value, ordinality);
  update documents set status = 'ready', extracted_text = body, page_count = pages, chunk_count = cardinality(parts), processing_token = null, processing_started_at = null, error_message = null where id = doc_id and user_id = auth.uid();
end;
$$;
-- Lexical retrieval (FTS + Korean substring/trigram matching). No invented embeddings.
create function public.search_document_chunks(query_text text, selected_ids uuid[] default null)
returns table(chunk_id uuid, document_id uuid, document_name text, "position" integer, content text, rank real)
language sql stable security invoker set search_path = public, extensions as $$
  with terms as (
    select term from regexp_split_to_table(lower(left(query_text, 2000)), '[[:space:][:punct:]]+') term where char_length(term) >= 2 limit 30
  ), ranked as (
    select c.id, c.document_id, d.name, c.position, c.content,
      (ts_rank_cd(c.search_vector, plainto_tsquery('simple', left(query_text, 2000))) +
       coalesce((select count(*)::real from terms where strpos(lower(c.content), term) > 0), 0) +
       case when extensions.word_similarity(left(query_text, 2000), c.content) >= 0.15 then extensions.word_similarity(left(query_text, 2000), c.content) else 0 end)::real as score
    from document_chunks c join documents d on d.id = c.document_id
    where c.user_id = auth.uid() and d.status = 'ready'
      and (selected_ids is null or c.document_id = any(selected_ids))
  ) select id, document_id, name, position, content, score from ranked where score > 0 order by score desc, id limit 6;
$$;
revoke all on function public.begin_document_processing(uuid) from public, anon;
revoke all on function public.finish_document_processing(uuid,uuid,text,integer,text[],text) from public, anon;
revoke all on function public.search_document_chunks(text,uuid[]) from public, anon;
grant execute on function public.begin_document_processing(uuid) to authenticated;
grant execute on function public.finish_document_processing(uuid,uuid,text,integer,text[],text) to authenticated;
grant execute on function public.search_document_chunks(text,uuid[]) to authenticated;
commit;
