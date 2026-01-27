'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimLead() {
    console.log('claimLead: Start')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.log('claimLead: No User')
        return { error: 'Unauthorized' }
    }

    // Check if lead is already assigned for today
    let { data: state, error: fetchError } = await supabase.from('daily_state').select('*').eq('id', 1).maybeSingle()

    if (fetchError) {
        console.error('claimLead: Fetch Error', fetchError)
        return { error: 'Failed to fetch state' }
    }

    // If no state exists, creating it
    if (!state) {
        console.log('claimLead: No state found, creating new state')
        const { data: newState, error: insertError } = await supabase
            .from('daily_state')
            .insert({
                id: 1,
                current_lead_id: user.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (insertError) {
            console.error('claimLead: Init Error', insertError)
            return { error: 'Failed to initialize daily state' }
        }
        state = newState
        revalidatePath('/employee')
        return { success: true }
    }

    const today = new Date().toISOString().split('T')[0]
    const lastUpdate = state?.updated_at ? state.updated_at.split('T')[0] : null

    // If state was updated today and there is a lead, block (unless it's self, but usually lock)
    if (state?.current_lead_id && lastUpdate === today) {
        if (state.current_lead_id === user.id) {
            console.log('claimLead: Already Active Lead')
            return { success: true } // Already lead
        }
        console.log('claimLead: Claimed by others today')
        return { error: 'Алхах хуваарилагдсан байна' }
    }

    // Otherwise (no lead, or stale lead from yesterday), claim it.
    const { error } = await supabase
        .from('daily_state')
        .update({ current_lead_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', 1)

    if (error) {
        console.error('claimLead: Update Error', error)
        return { error: error.message }
    }

    console.log('claimLead: Success')
    revalidatePath('/employee')
    return { success: true }
}

export async function submitReport(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is lead?
    const { data: state } = await supabase.from('daily_state').select('*').eq('id', 1).single()

    // Also check if state is fresh for today, though unlikely to be stale if submitting report
    const today = new Date().toISOString().split('T')[0]
    const lastUpdate = state?.updated_at ? state.updated_at.split('T')[0] : null

    if (lastUpdate !== today || state?.current_lead_id !== user.id) {
        return { error: 'Only the active Lead can submit reports' }
    }

    // Parse fields
    const mendmoss_s = Number(formData.get('mendmoss_s'))
    const mendmoss_m = Number(formData.get('mendmoss_m'))
    const mendhusk_s = Number(formData.get('mendhusk_s'))
    const mendhusk_m = Number(formData.get('mendhusk_m'))
    const jars_s = Number(formData.get('jars_s'))
    const jars_m = Number(formData.get('jars_m'))

    // Delivery times
    const distributor_time_str = formData.get('distributor_start') as string
    const sales_time_str = formData.get('sales_start') as string

    const now = new Date()
    let distributor_start = null
    let sales_start = null

    if (distributor_time_str) {
        const [h, m] = distributor_time_str.split(':').map(Number)
        distributor_start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).toISOString()
    }
    if (sales_time_str) {
        const [h, m] = sales_time_str.split(':').map(Number)
        sales_start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).toISOString()
    }

    // Optional jar photo
    let jar_photo_url = null
    const file = formData.get('jar_photo') as File
    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop()
        const fileName = `reports/${Date.now()}-jars.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('reports').upload(fileName, file)
        if (!uploadError) {
            const { data } = supabase.storage.from('reports').getPublicUrl(fileName)
            jar_photo_url = data.publicUrl
        }
    }

    // Helper to build payload
    const payload: any = {
        lead_user_id: user.id,
        mendmoss_s,
        mendmoss_m,
        mendhusk_s,
        mendhusk_m,
        jars_s,
        jars_m,
        jar_photo_url
    }

    if (distributor_start) payload.distributor_start = distributor_start
    if (sales_start) payload.sales_start = sales_start

    // Check for existing report to update, or create new
    const { data: existingReport } = await supabase.from('production_reports').select('id').eq('date', today).limit(1).single()

    let error;
    if (existingReport) {
        const { error: updateError } = await supabase.from('production_reports').update(payload).eq('id', existingReport.id)
        error = updateError
    } else {
        payload.date = today
        const { error: insertError } = await supabase.from('production_reports').insert(payload)
        error = insertError
    }

    if (error) return { error: error.message }

    revalidatePath('/employee')
    return { success: true }
}
