create or replace function get_dashboard_stats()
returns jsonb
language plpgsql
as $$
declare
  active_members int;
  revenue numeric;
begin
  select count(*) into active_members from members where is_active = true;
  select coalesce(sum(amount),0) into revenue from payments;
  return jsonb_build_object('activeMembers', active_members, 'revenueThisMonth', revenue);
end;
$$;
