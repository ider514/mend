'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateDistance, FALLBACK_TARGET_LAT, FALLBACK_TARGET_LNG, FALLBACK_MAX_DISTANCE } from '@/lib/gps'

export async function clockIn(lat: number, lng: number, selfieFormData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch system settings
    const { data: settingsData } = await supabase.from('system_settings').select('*')
    const settingsMap = settingsData?.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc }, {}) || {}

    const targetLat = parseFloat(settingsMap['gps_target_lat'] || FALLBACK_TARGET_LAT)
    const targetLng = parseFloat(settingsMap['gps_target_lng'] || FALLBACK_TARGET_LNG)
    const maxDistance = parseFloat(settingsMap['gps_max_distance'] || FALLBACK_MAX_DISTANCE)

    // Validate GPS
    const distance = calculateDistance(lat, lng, targetLat, targetLng)
    if (distance > maxDistance) {
        return { error: `Too far from workplace. Distance: ${Math.round(distance)}m, Max: ${maxDistance}m` }
    }

    // 1. Upload Selfie
    const file = selfieFormData.get('file') as File
    if (!file) return { error: 'Selfie required' }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-in.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('attendance')
        .upload(fileName, file)

    if (uploadError) return { error: 'Failed to upload selfie' }

    const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName)

    // 2. Create Shift Record
    const { error: insertError } = await supabase.from('shifts').insert({
        user_id: user.id,
        gps_in: `${lat},${lng}`,
        selfie_in: publicUrl,
        start_time: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0] // today's date
    })

    if (insertError) return { error: insertError.message }

    revalidatePath('/employee')
    return { success: true }
}

export async function clockOut(shiftId: string, lat: number, lng: number, selfieFormData: FormData) {
    const supabase = await createClient()

    // 1. Upload Selfie
    const file = selfieFormData.get('file') as File
    if (!file) return { error: 'Selfie required' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Validate GPS (Optional for clock out? Usually yes for "on site" verification)
    const { data: settingsData } = await supabase.from('system_settings').select('*')
    const settingsMap = settingsData?.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc }, {}) || {}

    const targetLat = parseFloat(settingsMap['gps_target_lat'] || FALLBACK_TARGET_LAT)
    const targetLng = parseFloat(settingsMap['gps_target_lng'] || FALLBACK_TARGET_LNG)
    const maxDistance = parseFloat(settingsMap['gps_max_distance'] || FALLBACK_MAX_DISTANCE)

    const distance = calculateDistance(lat, lng, targetLat, targetLng)
    if (distance > maxDistance) {
        return { error: `Too far to clock out. Distance: ${Math.round(distance)}m` }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-out.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('attendance')
        .upload(fileName, file)

    if (uploadError) return { error: 'Failed to upload selfie' }

    const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName)

    // 2. Update Shift
    const { error: updateError } = await supabase.from('shifts').update({
        end_time: new Date().toISOString(),
        gps_out: `${lat},${lng}`,
        selfie_out: publicUrl
    }).eq('id', shiftId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/employee')
    return { success: true }
}

export async function startBreak(shiftId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('shifts').update({
        break_start: new Date().toISOString()
    }).eq('id', shiftId)

    if (error) return { error: error.message }
    revalidatePath('/employee')
    return { success: true }
}

export async function endBreak(shiftId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('shifts').update({
        break_end: new Date().toISOString()
    }).eq('id', shiftId)

    if (error) return { error: error.message }
    revalidatePath('/employee')
    return { success: true }
}
