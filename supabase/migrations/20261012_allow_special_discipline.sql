-- Allows a persisted special masterclass while preserving the existing
-- discipline restrictions for all regular scheduled classes.
alter table public.safezone_teacher_schedules
  drop constraint if exists safezone_teacher_schedules_discipline_check;

alter table public.safezone_teacher_schedules
  add constraint safezone_teacher_schedules_discipline_check
  check (discipline in ('defensa-personal', 'boxeo', 'taekwondo', 'hapkido', 'especial'));
