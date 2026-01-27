'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'

export default function VerificationGallery() {
    const [photos, setPhotos] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchPhotos = async () => {
            const today = new Date().toISOString().split('T')[0]
            // Fetch shifts with photos
            const { data: shifts } = await supabase
                .from('shifts')
                .select('*, profiles(full_name)')
                .eq('date', today)
                .not('selfie_in', 'is', null)

            const items: any[] = []
            if (shifts) {
                shifts.forEach(s => {
                    if (s.selfie_in) items.push({ url: s.selfie_in, type: 'Өглөө', user: s.profiles?.full_name, time: s.start_time, id: s.id + 'in' })
                    if (s.selfie_out) items.push({ url: s.selfie_out, type: 'Орой', user: s.profiles?.full_name, time: s.end_time, id: s.id + 'out' })
                })
            }
            setPhotos(items)
        }

        fetchPhotos()
    }, [supabase])

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map(photo => (
                <Dialog key={photo.id}>
                    <DialogTrigger asChild>
                        <div className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                            <img src={photo.url} alt="Verification" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-2 text-xs">
                                <div className="font-bold truncate">{photo.user}</div>
                                <div className="flex justify-between">
                                    <span>{photo.type}</span>
                                    <span>{format(new Date(photo.time), 'HH:mm')}</span>
                                </div>
                            </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-zinc-800">
                        <img src={photo.url} alt="Full view" className="w-full h-full object-contain" />
                    </DialogContent>
                </Dialog>
            ))}
            {photos.length === 0 && <div className="col-span-4 text-center text-gray-500 py-10">Зураг олдсонгүй</div>}
        </div>
    )
}
