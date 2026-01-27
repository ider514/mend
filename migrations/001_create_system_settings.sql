-- Create a key-value store for system settings
create table if not exists system_settings (
  key text primary key,
  value text not null,
  description text
);

-- Turn on RLS
alter table system_settings enable row level security;

-- Allow read access to authenticated users (employees need to read settings)
create policy "Authenticated users can read settings"
  on system_settings for select
  to authenticated
  using (true);

-- Allow write access only to specific users (e.g., admins/managers) - For now, maybe just manual DB edits
-- or specific policy later.

-- Insert default Geofence settings
insert into system_settings (key, value, description)
values 
  ('gps_target_lat', '47.9224', 'Workplace Latitude'),
  ('gps_target_lng', '106.9311', 'Workplace Longitude'),
  ('gps_max_distance', '10000', 'Max allowed distance in meters')
on conflict (key) do nothing;
