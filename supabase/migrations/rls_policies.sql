alter table members enable row level security;
create policy "members_by_user" on members
  for select using (auth.uid() = user_id);
