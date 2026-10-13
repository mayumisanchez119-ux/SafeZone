-- Shared payments. Only Safe Zone objects are modified.
-- Guest RPCs deliberately expose one code-scoped result, never the payment list.
begin;
create schema if not exists safezone_private;
revoke all on schema safezone_private from public;
grant usage on schema safezone_private to anon, authenticated;
alter table public.safezone_transactions add column if not exists source_id text;
create unique index if not exists safezone_transactions_source_id on public.safezone_transactions(source_id);
create table if not exists safezone_private.receipts (
  payment_id uuid primary key references public.safezone_transactions(id) on delete cascade,
  image_data text not null check (length(image_data) <= 1500000),
  expires_at timestamptz not null
);
create index if not exists safezone_receipts_expiry on safezone_private.receipts(expires_at);
create table if not exists safezone_private.enrollments (
  session_id text not null,
  payment_id uuid not null references public.safezone_transactions(id) on delete cascade,
  attendee jsonb not null,
  primary key(session_id,payment_id)
);
alter table safezone_private.receipts enable row level security;
alter table safezone_private.enrollments enable row level security;
revoke all on safezone_private.receipts,safezone_private.enrollments from public,anon,authenticated;
create table if not exists safezone_private.deleted_payments (source_id text primary key, unique_code text not null);
alter table safezone_private.deleted_payments enable row level security;
revoke all on safezone_private.deleted_payments from public,anon,authenticated;

-- A guest has no Auth user: this narrowly scoped entrypoint accepts only an
-- unapproved payment, derives prices/tickets from the catalog, and validates
-- class capacity. Only an authenticated Safe Zone admin may import old records.
create or replace function safezone_private.submit_payment(p_transaction jsonb,p_receipt text,p_import boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  existing public.safezone_transactions;
  schedule public.safezone_teacher_schedules;
  combo jsonb;
  tx jsonb;
  payment uuid;
  session_key text;
  code text;
  kind text;
  amount numeric;
  tickets integer;
  created timestamptz := now();
  approved timestamptz;
  state text := 'pending';
  expiry timestamptz;
  source text := p_transaction->>'id';
begin
  p_import := coalesce(p_import,false);
  if p_import and (auth.uid() is null or not public.safezone_is_admin()) then raise exception 'Acceso administrativo requerido'; end if;
  if source is null or length(source)>100 then raise exception 'Registro inválido'; end if;
  if not p_import and source !~ '^[0-9a-f-]{36}$' then raise exception 'Identificador inválido'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('safezone-payment-'||source));
  if exists(select 1 from safezone_private.deleted_payments where source_id=source or (p_import and unique_code=upper(p_transaction->>'uniqueCode'))) then
    return jsonb_build_object('id',source,'cloudSynced',true,'deleted',true);
  end if;
  select * into existing from public.safezone_transactions where source_id=source;
  if found then return existing.payload||jsonb_build_object('cloudSynced',true); end if;
  if length(trim(coalesce(p_transaction->>'studentName',''))) not between 1 and 160 then raise exception 'Indica el nombre de la alumna'; end if;
  if not p_import and regexp_replace(coalesce(p_transaction->>'studentPhone',''),'[^0-9]','','g') !~ '^[0-9]{7,15}$' then raise exception 'Indica un teléfono válido'; end if;
  if length(coalesce(p_receipt,''))>1500000 or (p_receipt is not null and p_receipt !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$') then raise exception 'Comprobante inválido'; end if;
  if not p_import and p_receipt is null then raise exception 'Adjunta el comprobante de pago'; end if;
  if p_import then
    code := upper(p_transaction->>'uniqueCode');
    if code is null or code !~ '^SZ-[A-Z0-9-]{5,40}$' then raise exception 'Código antiguo inválido'; end if;
    select * into existing from public.safezone_transactions where unique_code=code;
    if found then return existing.payload||jsonb_build_object('cloudSynced',true); end if;
    created := coalesce((p_transaction->>'createdAt')::timestamptz,now());
    state := case when p_transaction->>'status' in ('approved','rejected') then p_transaction->>'status' else 'pending' end;
    approved := (p_transaction->>'approvedAt')::timestamptz;
    tx := p_transaction - 'receiptUrl' - 'receiptStorageKey';
    session_key := p_transaction->>'sessionId';
  else
    kind := p_transaction->>'type';
    if kind='combo' then
      select item into combo from public.safezone_content c cross join lateral jsonb_array_elements(c.payload) item
        where c.content_key='combos' and item->>'id'=p_transaction->>'comboId' limit 1;
      if combo is null then raise exception 'El combo ya no está disponible'; end if;
      amount := (combo->>'price')::numeric; tickets := (combo->>'totalTickets')::integer;
      tx := jsonb_build_object('type','combo','comboId',combo->>'id','title',combo->>'title','discipline',combo->>'discipline',
        'disciplineLabel',combo->>'disciplineLabel','amount',amount,'totalTickets',tickets,'remainingTickets',tickets);
    else
      session_key := p_transaction->>'sessionId';
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('safezone-class-'||session_key));
      select * into schedule from public.safezone_teacher_schedules where 'teacher-'||id::text=session_key;
      if not found then raise exception 'La clase ya no está disponible'; end if;
      if schedule.class_date < (now() at time zone 'America/Bogota')::date then raise exception 'La clase ya pasó'; end if;
      if (select count(*) from safezone_private.enrollments where session_id=session_key)>=schedule.capacity then raise exception 'La clase ya no tiene cupos'; end if;
      amount := case when schedule.class_kind='special' then
        case when (schedule.special_data->>'presale_ends_on')::date >= (now() at time zone 'America/Bogota')::date
        then (schedule.special_data->>'presale_price')::numeric else (schedule.special_data->>'regular_price')::numeric end else 10000 end;
      tx := jsonb_build_object('type',case when schedule.class_kind='special' then 'special_class' else 'single_class' end,
        'sessionId',session_key,'sessionDate',schedule.class_date,'sessionTime',to_char(schedule.start_time,'HH24:MI')||' - '||to_char(schedule.end_time,'HH24:MI'),
        'sessionLocation',schedule.location,'title',schedule.title,'discipline',schedule.discipline,'disciplineLabel',upper(schedule.discipline),
        'amount',amount,'totalTickets',1,'remainingTickets',0);
    end if;
    if amount is null or amount<0 or amount>10000000 then raise exception 'Tarifa de clase inválida'; end if;
    code := case when kind='combo' then 'SZ-' else 'SZ-CL-' end||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    tx := tx||jsonb_build_object('studentName',trim(p_transaction->>'studentName'),'studentPhone',regexp_replace(p_transaction->>'studentPhone','[^0-9]','','g'),
      'studentEmail','','paymentMethod',left(coalesce(p_transaction->>'paymentMethod','Transferencia'),120),'approvedAt',null,
      'expiryDate',case when kind='combo' then to_jsonb(now()+interval '60 days') else to_jsonb(schedule.class_date) end,
      'history',jsonb_build_array(jsonb_build_object('action','Comprobante recibido','detail','Pendiente de aprobación administrativa','date',now())));
  end if;
  tx := tx||jsonb_build_object('id',source,'uniqueCode',code,'status',state,'createdAt',created,'receiptUrl',null,
    'receiptExpiresAt',created+interval '15 days','cloudSynced',true);
  insert into public.safezone_transactions(source_id,unique_code,payload,status,created_at,approved_at)
    values(source,code,tx,state,created,approved) returning id into payment;
  if p_receipt is not null and created+interval '15 days'>now() then
    insert into safezone_private.receipts values(payment,p_receipt,created+interval '15 days');
  end if;
  if session_key is not null then
    insert into safezone_private.enrollments values(session_key,payment,jsonb_build_object('id',source,'name',tx->>'studentName','phone',tx->>'studentPhone',
      'uniqueCode',code,'paymentMethod','single_payment','registeredAt',created)) on conflict do nothing;
  end if;
  return tx;
end $$;

create or replace function safezone_private.lookup_payment(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select payload - 'receiptStorageKey' - 'receiptUrl' from public.safezone_transactions
  where unique_code=upper(trim(p_code)) or
    (trim(p_code) ~ '^[0-9]{7,15}$' and payload->>'studentPhone'=trim(p_code))
  order by created_at desc limit 1;
$$;
create or replace function safezone_private.payment_counts()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(session_id,n),'{}'::jsonb)
  from (select session_id,count(*) n from safezone_private.enrollments group by session_id) counts;
$$;
create or replace function safezone_private.admin_payments()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.safezone_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  return jsonb_build_object('transactions',(select coalesce(jsonb_agg(t.payload||jsonb_build_object('receiptUrl',null,'hasReceipt',r.expires_at>now(),
    'receiptRemovedAt',case when r.expires_at<=now() or (t.created_at+interval '15 days'<=now() and r.payment_id is null) then now() else null end) order by t.created_at desc),'[]'::jsonb)
    from public.safezone_transactions t left join safezone_private.receipts r on r.payment_id=t.id),
    'attendees',(select coalesce(jsonb_object_agg(session_id,attendees),'{}'::jsonb) from
    (select session_id,jsonb_agg(attendee) attendees from safezone_private.enrollments group by session_id) groups));
end $$;
create or replace function safezone_private.admin_receipt(p_id text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare image text;
begin
  if auth.uid() is null or not public.safezone_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  select r.image_data into image from safezone_private.receipts r join public.safezone_transactions t on t.id=r.payment_id
    where t.source_id=p_id and r.expires_at>now();
  return image;
end $$;
create or replace function safezone_private.change_payment(p_id text,p_status text,p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.safezone_transactions; updated jsonb;
begin
  if auth.uid() is null or not public.safezone_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  select * into t from public.safezone_transactions where source_id=p_id for update;
  if not found then raise exception 'Pago no encontrado'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Estado inválido'; end if;
  if t.status=p_status then return t.payload; end if;
  updated := t.payload||jsonb_build_object('status',p_status,'history',coalesce(t.payload->'history','[]'::jsonb)||jsonb_build_array(
    jsonb_build_object('action',case when p_status='approved' then 'Pago Aprobado' else 'Pago Rechazado' end,'detail',left(coalesce(p_note,'Validado por la administradora'),500),'date',now())));
  if p_status='approved' then
    updated := updated||jsonb_build_object('approvedAt',now());
    if t.payload->>'type'='combo' and t.approved_at is null then updated := updated||jsonb_build_object('expiryDate',now()+interval '60 days'); end if;
  end if;
  update public.safezone_transactions set payload=updated,status=p_status,approved_at=case when p_status='approved' then coalesce(approved_at,now()) else approved_at end where id=t.id;
  return updated;
end $$;
create or replace function safezone_private.delete_payment(p_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.safezone_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  insert into safezone_private.deleted_payments select source_id,unique_code from public.safezone_transactions where source_id=p_id on conflict do nothing;
  delete from public.safezone_transactions where source_id=p_id;
  return found;
end $$;
create or replace function safezone_private.redeem(p_code text,p_session text,p_name text,p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.safezone_transactions; s public.safezone_teacher_schedules; updated jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('safezone-class-'||p_session));
  select * into s from public.safezone_teacher_schedules where 'teacher-'||id::text=p_session;
  if not found then raise exception 'Clase no encontrada'; end if;
  if s.class_kind='special' then raise exception 'La masterclass no está incluida en la ticketera'; end if;
  if s.class_date<(now() at time zone 'America/Bogota')::date then raise exception 'La clase ya pasó'; end if;
  select * into t from public.safezone_transactions where unique_code=upper(trim(p_code)) for update;
  if not found or t.status<>'approved' or t.payload->>'type'<>'combo' then raise exception 'Código de ticketera no aprobado'; end if;
  if exists(select 1 from safezone_private.enrollments where session_id=p_session and payment_id=t.id) then return t.payload; end if;
  if coalesce((t.payload->>'remainingTickets')::integer,0)<=0 then raise exception 'No quedan tickets disponibles'; end if;
  if (t.payload->>'expiryDate')::timestamptz<now() then raise exception 'La ticketera está vencida'; end if;
  if t.payload->>'discipline' not in ('all',s.discipline) then raise exception 'El combo no aplica para esta disciplina'; end if;
  if (select count(*) from safezone_private.enrollments where session_id=p_session)>=s.capacity then raise exception 'La clase ya no tiene cupos'; end if;
  if length(trim(coalesce(p_name,''))) not between 1 and 160 or p_phone !~ '^[0-9]{7,15}$' then raise exception 'Nombre o teléfono inválido'; end if;
  updated := t.payload||jsonb_build_object('remainingTickets',(t.payload->>'remainingTickets')::integer-1,
    'history',coalesce(t.payload->'history','[]'::jsonb)||jsonb_build_array(jsonb_build_object('action','Redención de Ticket','detail','Cupo reservado para '||s.title||' ('||s.class_date||')','date',now())));
  insert into safezone_private.enrollments values(p_session,t.id,jsonb_build_object('id',gen_random_uuid(),'name',trim(p_name),'phone',p_phone,'uniqueCode',t.unique_code,'paymentMethod','ticket','registeredAt',now()));
  update public.safezone_transactions set payload=updated where id=t.id;
  return updated;
end $$;
create or replace function safezone_private.import_attendees(p_attendees jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare pair record; person jsonb; payment uuid; imported integer:=0;
begin
  if auth.uid() is null or not public.safezone_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  for pair in select * from jsonb_each(p_attendees) loop
    for person in select * from jsonb_array_elements(pair.value) loop
      select id into payment from public.safezone_transactions where unique_code=person->>'uniqueCode';
      if payment is not null then
        insert into safezone_private.enrollments values(pair.key,payment,person) on conflict do nothing;
        if found then imported:=imported+1; end if;
      end if;
    end loop;
  end loop;
  return imported;
end $$;

-- Invoker wrappers are the only REST surface; private functions implement each
-- constrained operation. No guest is granted direct table access.
create or replace function public.safezone_submit_payment(p_transaction jsonb,p_receipt text,p_import boolean default false)
returns jsonb language sql security invoker set search_path = '' as $$ select safezone_private.submit_payment(p_transaction,p_receipt,p_import); $$;
create or replace function public.safezone_lookup_payment(p_code text)
returns jsonb language sql security invoker set search_path = '' as $$ select safezone_private.lookup_payment(p_code); $$;
create or replace function public.safezone_payment_counts()
returns jsonb language sql security invoker set search_path = '' as $$ select safezone_private.payment_counts(); $$;
create or replace function public.safezone_admin_payments()
returns jsonb language sql security invoker set search_path = '' as $$ select safezone_private.admin_payments(); $$;
create or replace function public.safezone_admin_receipt(p_id text)
returns text language sql security invoker set search_path = '' as $$ select safezone_private.admin_receipt(p_id); $$;
create or replace function public.safezone_change_payment(p_id text,p_status text,p_note text default '')
returns jsonb language sql security invoker set search_path = '' as $$ select safezone_private.change_payment(p_id,p_status,p_note); $$;
create or replace function public.safezone_delete_payment(p_id text)
returns boolean language sql security invoker set search_path = '' as $$ select safezone_private.delete_payment(p_id); $$;
create or replace function public.safezone_redeem(p_code text,p_session text,p_name text,p_phone text)
returns jsonb language sql security invoker set search_path = '' as $$ select safezone_private.redeem(p_code,p_session,p_name,p_phone); $$;
create or replace function public.safezone_import_attendees(p_attendees jsonb)
returns integer language sql security invoker set search_path = '' as $$ select safezone_private.import_attendees(p_attendees); $$;
revoke all on all functions in schema safezone_private from public;
grant execute on function safezone_private.submit_payment(jsonb,text,boolean),safezone_private.lookup_payment(text),safezone_private.payment_counts(),safezone_private.redeem(text,text,text,text) to anon,authenticated;
grant execute on function safezone_private.admin_payments(),safezone_private.change_payment(text,text,text),safezone_private.delete_payment(text),safezone_private.import_attendees(jsonb) to authenticated;
revoke all on function public.safezone_submit_payment(jsonb,text,boolean),public.safezone_lookup_payment(text),public.safezone_payment_counts(),public.safezone_admin_payments(),public.safezone_change_payment(text,text,text),public.safezone_delete_payment(text),public.safezone_redeem(text,text,text,text),public.safezone_import_attendees(jsonb) from public;
grant execute on function public.safezone_submit_payment(jsonb,text,boolean),public.safezone_lookup_payment(text),public.safezone_payment_counts(),public.safezone_redeem(text,text,text,text) to anon,authenticated;
grant execute on function public.safezone_admin_payments(),public.safezone_change_payment(text,text,text),public.safezone_delete_payment(text),public.safezone_import_attendees(jsonb) to authenticated;
revoke all on function public.safezone_admin_receipt(text) from public;
grant execute on function public.safezone_admin_receipt(text),safezone_private.admin_receipt(text) to authenticated;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('safezone-receipt-retention','15 * * * *', 'delete from safezone_private.receipts where expires_at <= now()');
notify pgrst,'reload schema';
commit;
