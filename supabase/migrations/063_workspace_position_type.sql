-- Position type metadata on workspace position settings

alter table public.workspace_position_settings
  add column if not exists position_type text
    check (
      position_type is null
      or position_type in (
        'branch',
        'division',
        'group',
        'strike_team',
        'task_force',
        'single_resource',
        'custom_type'
      )
    ),
  add column if not exists custom_type_label text;
