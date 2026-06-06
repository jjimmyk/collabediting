-- Ensure invited users get a profile and roster activation on first sign-in

create or replace function public.activate_my_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  select lower(email) into user_email from auth.users where id = auth.uid();
  if user_email is null then
    return;
  end if;

  insert into public.profiles (id, email, full_name)
  select
    auth.uid(),
    user_email,
    coalesce(
      (select raw_user_meta_data ->> 'full_name' from auth.users where id = auth.uid()),
      split_part(user_email, '@', 1)
    )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  update public.workspace_members
  set
    user_id = auth.uid(),
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where lower(email) = user_email
    and status in ('invited', 'active')
    and (user_id is null or user_id = auth.uid());
end;
$$;
