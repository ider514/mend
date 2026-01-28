'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { claimLead, submitReport } from './lead-actions'
import { Crown, Truck, ShoppingBag, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function LeadControl({ userId, todayReport }: { userId: string, todayReport: any }) {
    const [currentLead, setCurrentLead] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false)
    const [deliveryType, setDeliveryType] = useState<'distributor' | 'sales' | null>(null)
    const [deliveryTimeInput, setDeliveryTimeInput] = useState('')

    // Captured times (HH:MM string)
    const [distributorTime, setDistributorTime] = useState<string | null>(null)
    const [salesTime, setSalesTime] = useState<string | null>(null)
    const [showJarPrep, setShowJarPrep] = useState(false)

    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Initialize state from existing report if available
    useEffect(() => {
        if (todayReport?.distributor_start) {
            setDistributorTime(new Date(todayReport.distributor_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        }
        if (todayReport?.sales_start) {
            setSalesTime(new Date(todayReport.sales_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
        }
    }, [todayReport])

    // Initialize delivery time input to current time
    useEffect(() => {
        if (isDeliveryDialogOpen) {
            const now = new Date()
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            setDeliveryTimeInput(timeString)
        }
    }, [isDeliveryDialogOpen])

    useEffect(() => {
        // Initial fetch - check freshness
        const today = new Date().toISOString().split('T')[0]

        supabase.from('daily_state').select('current_lead_id, updated_at').eq('id', 1).maybeSingle()
            .then(({ data }) => {
                if (data && data.updated_at) {
                    const lastUpdate = data.updated_at.split('T')[0]
                    if (lastUpdate === today) {
                        setCurrentLead(data.current_lead_id)
                    } else {
                        setCurrentLead(null)
                    }
                } else {
                    setCurrentLead(null) // If no data or no updated_at, assume no current lead
                }
            })

        // Realtime subscription
        const channel = supabase
            .channel('daily_state_changes')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'daily_state', filter: 'id=eq.1' },
                (payload) => {
                    const newRecord = payload.new
                    const lastUpdate = newRecord.updated_at ? newRecord.updated_at.split('T')[0] : null
                    if (lastUpdate === today) {
                        setCurrentLead(newRecord.current_lead_id)
                    } else {
                        setCurrentLead(null)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    const handleClaim = async () => {
        setLoading(true)
        const res = await claimLead()
        setLoading(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Та өнөөдрийн ахлах боллоо')
            setCurrentLead(userId)
        }
    }

    const openDeliveryDialog = (type: 'distributor' | 'sales') => {
        setDeliveryType(type)
        setIsDeliveryDialogOpen(true)
    }

    const handleDeliveryConfirm = () => {
        if (!deliveryType) return

        if (deliveryType === 'distributor') {
            setDistributorTime(deliveryTimeInput)
        } else {
            setSalesTime(deliveryTimeInput)
        }

        setIsDeliveryDialogOpen(false)
        toast.success(`${deliveryType === 'distributor' ? 'Дистрибьютор' : 'Борлуулалт'} цаг сонгогдлоо (Хадгалаагүй)`)
    }

    const handleSubmitReport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsDialogOpen(true)
    }

    const confirmSubmit = async () => {
        const form = document.querySelector('#report-form') as HTMLFormElement
        if (!form) return
        const formData = new FormData(form)

        // Append times if set
        if (distributorTime) formData.append('distributor_start', distributorTime)
        if (salesTime) formData.append('sales_start', salesTime)

        setLoading(true)
        const res = await submitReport(formData)
        setLoading(false)
        setIsDialogOpen(false)

        if (res.error) toast.error(res.error)
        else {
            toast.success('Тайлан илгээгдлээ')
        }
    }

    // Determine if report is "submitted" (has product data)
    const isReportSubmitted = todayReport && (todayReport.mendmoss_s !== null && todayReport.mendmoss_s !== undefined)

    return (
        <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-1">
                <CardTitle className="text-base flex justify-between items-center">
                    <span>Тайлан</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!currentLead ? (
                    <Button onClick={handleClaim} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        <Crown className="w-4 h-4 mr-2" /> Тайлан эхлэх
                    </Button>
                ) : currentLead === userId ? (
                    <div className="space-y-6">
                        {/* Delivery Section */}
                        <div>
                            <div className="text-sm font-medium text-zinc-500 mb-2">Хүргэлтийн цаг бүртгэх</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant={distributorTime ? "default" : "outline"}
                                    onClick={() => openDeliveryDialog('distributor')}
                                    disabled={loading || isReportSubmitted} // Disable editing if already fully submitted
                                    className="h-auto py-3 flex flex-col gap-1 items-start px-4 relative"
                                >
                                    <Truck className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-semibold">Миру</span>
                                    {distributorTime && (
                                        <span className="text-[10px] opacity-90 absolute top-2 right-2 bg-white/20 px-1 rounded">
                                            {distributorTime}
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    variant={salesTime ? "default" : "outline"}
                                    onClick={() => openDeliveryDialog('sales')}
                                    disabled={loading || isReportSubmitted}
                                    className="h-auto py-3 flex flex-col gap-1 items-start px-4 relative"
                                >
                                    <ShoppingBag className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-semibold">Онлайн хүргэлт</span>
                                    {salesTime && (
                                        <span className="text-[10px] opacity-90 absolute top-2 right-2 bg-white/20 px-1 rounded">
                                            {salesTime}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Report Section */}
                        {isReportSubmitted ? (
                            <div className="pt-4 border-t space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-green-50 text-green-800 p-3 rounded-md flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Тайлан илгээгдсэн</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {/* Show times in summary too */}
                                    {distributorTime && (
                                        <div className="bg-zinc-50 p-3 rounded-lg">
                                            <div className="text-zinc-500 text-xs mb-1">Миру Хүргэлт</div>
                                            <div className="font-bold">{distributorTime}</div>
                                        </div>
                                    )}
                                    {salesTime && (
                                        <div className="bg-zinc-50 p-3 rounded-lg">
                                            <div className="text-zinc-500 text-xs mb-1">Онлайн хүргэлт</div>
                                            <div className="font-bold">{salesTime}</div>
                                        </div>
                                    )}

                                    <div className="bg-zinc-50 p-3 rounded-lg">
                                        <div className="text-zinc-500 text-xs mb-1">Mendmoss (M)</div>
                                        <div className="font-bold text-lg">{todayReport.mendmoss_m}</div>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded-lg">
                                        <div className="text-zinc-500 text-xs mb-1">Mendmoss (S)</div>
                                        <div className="font-bold text-lg">{todayReport.mendmoss_s}</div>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded-lg">
                                        <div className="text-zinc-500 text-xs mb-1">Mendhusk (M)</div>
                                        <div className="font-bold text-lg">{todayReport.mendhusk_m}</div>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded-lg">
                                        <div className="text-zinc-500 text-xs mb-1">Mendhusk (S)</div>
                                        <div className="font-bold text-lg">{todayReport.mendhusk_s}</div>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded-lg col-span-2">
                                        <div className="text-zinc-500 text-xs mb-1">Шил угаалт</div>
                                        <div className="font-bold">{todayReport.jars_m} (M) / {todayReport.jars_s} (S)</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form id="report-form" onSubmit={handleSubmitReport} className="space-y-4 pt-4 border-t">
                                <div className="text-sm font-medium text-zinc-500 mb-2">Нийт үйлдвэрлэсэн тоо бүртгэх</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Mendmoss+</Label>
                                        <Input type="number" name="mendmoss_m" placeholder="0" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mendmoss</Label>
                                        <Input type="number" name="mendmoss_s" placeholder="0" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mendhusk+</Label>
                                        <Input type="number" name="mendhusk_m" placeholder="0" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mendhusk</Label>
                                        <Input type="number" name="mendhusk_s" placeholder="0" min="0" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center space-x-2 mb-4 bg-zinc-50 p-3 rounded-lg border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                                        <input
                                            type="checkbox"
                                            id="jar-prep-check"
                                            className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={showJarPrep}
                                            onChange={(e) => setShowJarPrep(e.target.checked)}
                                        />
                                        <Label htmlFor="jar-prep-check" className="cursor-pointer flex-1">Стикер наасан</Label>
                                    </div>

                                    {showJarPrep && (
                                        <div className="grid grid-cols-2 gap-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label>M шил хайрцаг</Label>
                                                <Input type="number" name="jars_m" placeholder="Хайрцгийн тоо" min="0" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>S шил хайрцаг</Label>
                                                <Input type="number" name="jars_s" placeholder="Хайрцгийн тоо" min="0" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" className="w-full">Тайлан илгээх</Button>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-zinc-500 text-center py-2">
                        Өнөөдрийн ахлах томилогдсон байна.
                    </div>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Тайлан баталгаажуулах</DialogTitle>
                        <DialogDescription className="pt-2 flex items-start gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            Алдаатай тохиолдолд мэдээллийг зөвхөн менежер засах боломжтойг анхаарна уу.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Болих</Button>
                        <Button onClick={confirmSubmit} disabled={loading}>Илгээх</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Цаг бүртгэх</DialogTitle>
                        <DialogDescription>
                            Хүргэлт гарсан цагийг оруулна уу.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Хүргэлт гарсан цаг</Label>
                        <Input
                            type="time"
                            className="mt-2 text-lg h-12"
                            value={deliveryTimeInput}
                            onChange={(e) => setDeliveryTimeInput(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeliveryDialogOpen(false)}>Болих</Button>
                        <Button onClick={handleDeliveryConfirm} disabled={loading}>Хадгалах</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}


