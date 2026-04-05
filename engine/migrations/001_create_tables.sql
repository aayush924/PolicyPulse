-- Enable pgvector extension
create extension if not exists vector;

-- Policy embeddings table for semantic search
create table if not exists policy_embeddings (
  id bigserial primary key,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(768),
  created_at timestamptz not null default now()
);

-- Index for vector similarity search
create index on policy_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for metadata filtering
create index idx_policy_metadata_payer
  on policy_embeddings using gin ((metadata->'payer_name'));

create index idx_policy_metadata_drug
  on policy_embeddings using gin ((metadata->'drug_name'));

-- Enable RLS and allow public read/insert (no service role key needed)
alter table policy_embeddings enable row level security;

create policy "Allow public read access"
  on policy_embeddings for select
  using (true);

create policy "Allow public insert access"
  on policy_embeddings for insert
  with check (true);

-- RPC function for filtered vector search
create or replace function match_policies(
  query_embedding vector(768),
  filter_payer text,
  filter_drug text,
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
  where
    pe.metadata->>'payer_name' ilike filter_payer
    and pe.metadata->>'drug_name' ilike '%' || filter_drug || '%'
  order by pe.embedding <=> query_embedding
  limit match_count;
end;
$$;
