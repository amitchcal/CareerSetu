-- Support tickets for Issue/Suggestion reporting

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_ref text unique not null, -- e.g. CS-0001
  name text not null,
  email text not null,
  phone text,
  criticality text not null check (criticality in ('critical', 'major', 'medium', 'low', 'suggestion')),
  description text not null,
  screenshot_url text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  admin_comment text,
  user_id uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-increment ticket ref using a sequence
create sequence if not exists support_ticket_seq start 1;

-- Function to generate ticket ref
create or replace function generate_ticket_ref()
returns trigger language plpgsql as $$
begin
  new.ticket_ref := 'CS-' || lpad(nextval('support_ticket_seq')::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists set_ticket_ref on support_tickets;
create trigger set_ticket_ref
  before insert on support_tickets
  for each row execute function generate_ticket_ref();

-- Update updated_at on change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_tickets_updated_at on support_tickets;
create trigger support_tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at();

-- Storage bucket for screenshots
insert into storage.buckets (id, name, public) values ('ticket-screenshots', 'ticket-screenshots', true)
  on conflict (id) do nothing;

-- Allow anyone to upload screenshots (they need the public URL)
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'Allow public uploads to ticket-screenshots'
  ) then
    create policy "Allow public uploads to ticket-screenshots"
      on storage.objects for insert
      with check (bucket_id = 'ticket-screenshots');
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'Allow public read of ticket-screenshots'
  ) then
    create policy "Allow public read of ticket-screenshots"
      on storage.objects for select
      using (bucket_id = 'ticket-screenshots');
  end if;
end $$;
