'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function LiveFeed() {
    const [activeShifts, setActiveShifts] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        // Initial fetch of active shifts (no end_time)
        const fetchActive = async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('shifts')
                .select('*, profiles(full_name, role)')
                .eq('date', today)
                .is('end_time', null)

            if (data) setActiveShifts(data)
        }

        fetchActive()

        const channel = supabase
            .channel('live_shifts')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'shifts' },
                () => { fetchActive() }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    const getStatus = (shift: any) => {
        if (shift.break_start && !shift.break_end) return { label: 'Цайнд орсон', color: 'bg-yellow-100 text-yellow-800' }
        return { label: 'Ажиллаж байна', color: 'bg-green-100 text-green-800' }
    }

    return (
        <div className="space-y-4">
            {activeShifts.length === 0 ? (
                <div className="text-gray-500 text-sm">Одоогоор ажиллаж байгаа хүн алга.</div>
            ) : (
                activeShifts.map(shift => {
                    const status = getStatus(shift)
                    return (
                        <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={shift.selfie_in} />
                                    <AvatarFallback>{shift.profiles?.full_name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{shift.profiles?.full_name || 'Нэргүй'}</div>
                                    <div className="text-xs text-gray-500">
                                        {format(new Date(shift.start_time), 'HH:mm')} цагт ирсэн
                                    </div>
                                </div>
                            </div>
                            <Badge variant="outline" className={`${status.color} border-0`}>
                                {status.label}
                            </Badge>
                        </div>
                    )
                })
            )}
        </div>
    )
}
