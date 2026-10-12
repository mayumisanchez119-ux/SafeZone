-- Stores special-event data alongside regular scheduled classes.
-- Existing rows remain regular classes and preserve their current data.
alter table public.safezone_teacher_schedules
  add column if not exists class_kind text not null default 'regular',
  add column if not exists special_data jsonb not null default '{}'::jsonb;

alter table public.safezone_teacher_schedules
  drop constraint if exists safezone_teacher_schedules_class_kind_check;

alter table public.safezone_teacher_schedules
  add constraint safezone_teacher_schedules_class_kind_check
  check (class_kind in ('regular', 'special'));
