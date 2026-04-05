-- Chat conversations table
create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat messages table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_chat_conversations_user on chat_conversations(user_id);
create index idx_chat_messages_conversation on chat_messages(conversation_id);

-- RLS (app-layer filtering by user_id; permissive policies for anon key)
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;

create policy "Allow all access to chat_conversations"
  on chat_conversations for all using (true) with check (true);

create policy "Allow all access to chat_messages"
  on chat_messages for all using (true) with check (true);

-- Unfiltered vector search for chat RAG (no payer/drug filter required)
create or replace function match_policies_chat(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pe.id,
    pe.content,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) as similarity
  from policy_embeddings pe
  order by pe.embedding <=> query_embedding
  limit match_count;
end;
$$;
