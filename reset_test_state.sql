-- 1. Clear all production reports (Reset reports)
truncate table production_reports;

-- 2. Clear Lead Reporter state
-- We can either set it to NULL or delete the row.
-- Deleting the row allows the "Self-Healing" logic to run again (creating a fresh state).
delete from daily_state where id = 1;

-- Alternatively, to just unassign the lead but keep the row:
-- update daily_state set current_lead_id = null, updated_at = (now() - interval '1 day') where id = 1;

-- Optional: Clear all shifts (attendance) if you want a complete "fresh start"
-- truncate table shifts;
