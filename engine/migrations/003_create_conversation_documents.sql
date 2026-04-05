-- Conversation documents table for chat file attachments
create table if not exists conversation_documents (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  filename text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_conversation_documents_conversation on conversation_documents(conversation_id);

-- RLS (app-layer filtering by conversation ownership; permissive policy consistent with other chat tables)
alter table conversation_documents enable row level security;

create policy "Allow all access to conversation_documents"
  on conversation_documents for all using (true) with check (true);
