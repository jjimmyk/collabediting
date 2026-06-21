-- Positions cannot use single_resource as a type; that value applies to member/asset assignments only.

update public.workspace_position_settings
set position_type = null
where position_type = 'single_resource';

alter table public.workspace_position_settings
  drop constraint if exists workspace_position_settings_position_type_check;

alter table public.workspace_position_settings
  add constraint workspace_position_settings_position_type_check
  check (
    position_type is null
    or position_type in (
      'branch',
      'division',
      'group',
      'strike_team',
      'task_force',
      'custom_type'
    )
  );
