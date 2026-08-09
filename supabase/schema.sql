-- Drawings table: stores all released characters across all worlds
create table if not exists drawings (
  id text primary key,
  world_id text not null check (world_id in ('duck','stickman','animal','random')),
  name text not null default 'Unnamed',
  art jsonb not null default '[]',
  animation_frames jsonb not null default '[]',
  animation_fps integer not null default 6,
  likes_count integer not null default 0,
  sound text default 'default',
  created_at timestamptz not null default now()
);

-- Likes table: one row per user key + drawing, prevents duplicate likes
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  drawing_id text not null references drawings(id) on delete cascade,
  user_key text not null,
  created_at timestamptz not null default now(),
  unique (drawing_id, user_key)
);

-- Indexes for common queries
create index if not exists drawings_world_created on drawings(world_id, created_at desc);
create index if not exists drawings_world_likes on drawings(world_id, likes_count desc);
create index if not exists likes_drawing on likes(drawing_id);

-- Enable realtime on drawings so clients get live updates
alter publication supabase_realtime add table drawings;

-- Row Level Security
alter table drawings enable row level security;
alter table likes enable row level security;

-- Anyone can read drawings
create policy "Public read drawings"
  on drawings for select
  using (true);

-- Anyone can insert a drawing (rate limiting handled client side)
create policy "Public insert drawings"
  on drawings for insert
  with check (true);

-- Nobody can update or delete drawings via client
create policy "No client updates on drawings"
  on drawings for update
  using (false);

-- Likes: anyone can read
create policy "Public read likes"
  on likes for select
  using (true);

-- Likes: anyone can insert their own like
create policy "Public insert likes"
  on likes for insert
  with check (true);

-- Function to increment likes_count atomically when a like is inserted
create or replace function increment_likes()
returns trigger language plpgsql security definer as $$
begin
  update drawings
    set likes_count = likes_count + 1
    where id = new.drawing_id;
  return new;
end;
$$;

create or replace trigger on_like_inserted
  after insert on likes
  for each row execute procedure increment_likes();
