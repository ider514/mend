'use client'

import { useState, useEffect } from 'react'
import { CameraCapture } from '@/components/camera/camera-capture'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import LeadControl from './lead-control'
import { calculateDistance, FALLBACK_TARGET_LAT, FALLBACK_TARGET_LNG, FALLBACK_MAX_DISTANCE } from '@/lib/gps'
import { toast } from 'sonner'
import { clockIn, clockOut, startBreak, endBreak } from './actions'
import { format, differenceInMinutes, parseISO } from 'date-fns'
import { History, Loader2, MapPin, Coffee, LogOut, CheckCircle2 } from 'lucide-react'

interface EmployeePageProps {
    currentShift: any
    userId: string
    todayReport: any
    settings: any
    pastShifts: any[]
}

export default function EmployeeDashboard({ currentShift, userId, todayReport, settings, pastShifts }: EmployeePageProps) {
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [distance, setDistance] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState<'idle' | 'camera-in' | 'camera-out'>('idle')

    // Parse Settings
    const targetLat = parseFloat(settings['gps_target_lat'] || FALLBACK_TARGET_LAT)
    const targetLng = parseFloat(settings['gps_target_lng'] || FALLBACK_TARGET_LNG)
    const maxDistance = parseFloat(settings['gps_max_distance'] || FALLBACK_MAX_DISTANCE)

    // GPS Watcher
    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            return
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setLocation({ lat: latitude, lng: longitude })
                const dist = calculateDistance(latitude, longitude, targetLat, targetLng)
                setDistance(dist)
            },
            (error) => {
                console.error('GPS Error', error)
                toast.error('Байршил тогтооход алдаа гарлаа. GPS асаана уу.')
            },
            { enableHighAccuracy: true }
        )

        return () => navigator.geolocation.clearWatch(watchId)
    }, [targetLat, targetLng])

    const handleClockIn = async (file: File) => {
        if (!location) return toast.error('Байршил тодорхойгүй байна')
        // Re-check distance strictly before submit
        if (distance && distance > maxDistance) {
            return toast.error(`Та ажлын байрнаас ${Math.round(distance)}м зайтай байна. ${maxDistance}м дотор байх ёстой.`)
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        const res = await clockIn(location.lat, location.lng, formData)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Амжилттай цаг бүртгэлээ')
            setView('idle')
        }
    }

    const handleClockOut = async (file: File) => {
        if (!location) return toast.error('Байршил тодорхойгүй байна')
        // GPS check for clock out as well? Requirement says "Validation: GPS Check". Assuming both.
        if (distance && distance > maxDistance) {
            return toast.error(`Та ажлын байрнаас ${Math.round(distance)}м зайтай байна.`)
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        // Reminder Logic logic should be here (popup if report not submitted by lead) - implemented later

        const res = await clockOut(currentShift.id, location.lat, location.lng, formData)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Амжилттай гарлаа')
            setView('idle')
        }
    }

    const handleBreak = async (action: 'start' | 'end') => {
        setLoading(true)
        const res = action === 'start' ? await startBreak(currentShift.id) : await endBreak(currentShift.id)
        setLoading(false)
        if (res.error) toast.error(res.error)
        else toast.success(action === 'start' ? 'Цайны цаг эхэллээ' : 'Цайны цаг дууслаа')
    }

    if (view === 'camera-in') {
        return (
            <div className="p-4 max-w-md mx-auto space-y-4">
                <Button variant="ghost" onClick={() => setView('idle')}>Буцах</Button>

                {/* GPS Indicator */}
                <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${!location ? 'bg-yellow-100 text-yellow-800' :
                    (distance && distance <= maxDistance) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    <MapPin className="w-4 h-4" />
                    {location ? (
                        distance ? `Зай: ${Math.round(distance)}м (${distance <= maxDistance ? 'Зөвшөөрөгдсөн' : 'Хэт хол'})` : 'Байршил тогтоож байна...'
                    ) : 'GPS хайж байна...'}
                </div>

                <CameraCapture onCapture={handleClockIn} label="Цаг бүртгэх (Selfie)" />
                {loading && <div className="text-center"><Loader2 className="animate-spin inline mr-2" /> Уншиж байна...</div>}
            </div>
        )
    }

    if (view === 'camera-out') {
        return (
            <div className="p-4 max-w-md mx-auto space-y-4">
                <Button variant="ghost" onClick={() => setView('idle')}>Буцах</Button>

                {/* GPS Indicator */}
                <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${!location ? 'bg-yellow-100 text-yellow-800' :
                    (distance && distance <= maxDistance) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    <MapPin className="w-4 h-4" />
                    {location ? (
                        distance ? `Зай: ${Math.round(distance)}м (${distance <= maxDistance ? 'Зөвшөөрөгдсөн' : 'Хэт хол'})` : 'Байршил тогтоож байна...'
                    ) : 'GPS хайж байна...'}
                </div>

                <CameraCapture onCapture={handleClockOut} label="Гарах (Selfie)" />
                {loading && <div className="text-center"><Loader2 className="animate-spin inline mr-2" /> Уншиж байна...</div>}
            </div>
        )
    }

    // Main Dashboard View
    return (
        <div className="p-4 max-w-md mx-auto space-y-6">

            {/* Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Миний төлөв</CardTitle>
                    <CardDescription>
                        {currentShift ?
                            (currentShift.end_time ? 'Ажлын цаг дууссан байна.' : 'Ажил дээр')
                            : 'Ажлын цаг эхлээгүй байна.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">


                    {/* Actions */}
                    {!currentShift && (
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={() => setView('camera-in')}
                            disabled={!location || (distance !== null && distance > maxDistance)}
                        >
                            Цаг бүртгүүлэх (Ирсэн)
                        </Button>
                    )}

                    {currentShift && !currentShift.end_time && (
                        <div className="grid grid-cols-2 gap-3">
                            {!currentShift.break_start ? (
                                <Button variant="outline" className="h-12" onClick={() => handleBreak('start')}>
                                    <Coffee className="mr-2 h-4 w-4" /> Цайнд гарах
                                </Button>
                            ) : !currentShift.break_end ? (
                                <Button variant="outline" className="h-12 bg-yellow-50 border-yellow-200" onClick={() => handleBreak('end')}>
                                    <Coffee className="mr-2 h-4 w-4" /> Цайнаас ирэх
                                </Button>
                            ) : (
                                <Button variant="outline" disabled className="h-12">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Цайны цаг дууссан
                                </Button>
                            )}

                            <Button
                                variant="destructive"
                                className="h-12"
                                onClick={() => setView('camera-out')}
                                disabled={!location || (distance !== null && distance > maxDistance)}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Гарах
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lead Control Section */}
            <LeadControl userId={userId} todayReport={todayReport} />

            {/* Shift History Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span>Сүүлийн ээлжүүд</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pastShifts.length === 0 ? (
                            <div className="text-sm text-zinc-500">Түүх олдсонгүй.</div>
                        ) : (
                            pastShifts.map((shift) => {
                                const start = parseISO(shift.start_time)
                                const end = shift.end_time ? parseISO(shift.end_time) : null
                                const durationMinutes = end ? differenceInMinutes(end, start) : 0
                                const hours = Math.floor(durationMinutes / 60)
                                const minutes = durationMinutes % 60

                                const isToday = new Date().toDateString() === start.toDateString()

                                return (
                                    <div key={shift.id} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0">
                                        <div>
                                            <div className="font-medium">
                                                {format(start, 'MM/dd')}
                                                {isToday && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Өнөөдөр</span>}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                {format(start, 'HH:mm')} - {end ? format(end, 'HH:mm') : '...'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {end ? (
                                                <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                                                    {hours}ц {minutes}м
                                                </div>
                                            ) : (
                                                <div className="text-green-600 font-medium text-xs">Идэвхтэй</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
