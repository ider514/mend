import { createClient } from '@/lib/supabase/server'
import EmployeeDashboard from './client-page'

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch today's shift for this user
    const today = new Date().toISOString().split('T')[0]

    const { data: shifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('start_time', { ascending: false })
        .limit(1)

    const currentShift = shifts && shifts.length > 0 ? shifts[0] : null

    // Fetch today's production report (if any)
    // We assume the report is for the "site" or "team", but our schema links it to `lead_user_id`.
    // If the current user is lead, they see it. If they are not lead, maybe they shouldn't see it?
    // But lead-control checks if user is lead.
    // Let's fetch the report where date=today.
    // If multiple reports exist (race condition), just taking one is fine for now.
    const { data: report } = await supabase
        .from('production_reports')
        .select('*')
        .eq('date', today)
        .limit(1)
        .single()

    // Fetch system settings for GPS
    const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*')

    // Convert array to object for easier access
    const settingsMap = settingsData?.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value
        return acc
    }, {}) || {}

    // Fetch past shifts for history (last 5)
    // We want shifts that are NOT today, or maybe just all completed shifts?
    // Let's just get last 5 shifts ordered by date desc
    const { data: pastShifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(5)

    return <EmployeeDashboard currentShift={currentShift} userId={user.id} todayReport={report} settings={settingsMap} pastShifts={pastShifts || []} />
}
