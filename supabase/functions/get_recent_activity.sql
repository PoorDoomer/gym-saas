create or replace function get_recent_activity()
returns setof jsonb
language plpgsql
as $$
begin
  return query select jsonb_build_object('member_id', member_id, 'check_in', check_in_time)
  from check_ins order by check_in_time desc limit 20;
end;
$$;
