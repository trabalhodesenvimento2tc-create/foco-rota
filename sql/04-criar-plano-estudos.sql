create table if not exists public.plano_estudos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dia smallint not null check (dia between 0 and 6),
  materia_id uuid references public.materias(id) on delete set null,
  minutos integer not null check (minutos between 5 and 240),
  observacao text,
  feito boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.plano_estudos enable row level security;

create policy "Usuários veem seu plano de estudos" on public.plano_estudos for select using (auth.uid() = user_id);
create policy "Usuários criam seu plano de estudos" on public.plano_estudos for insert with check (auth.uid() = user_id);
create policy "Usuários alteram seu plano de estudos" on public.plano_estudos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Usuários excluem seu plano de estudos" on public.plano_estudos for delete using (auth.uid() = user_id);
