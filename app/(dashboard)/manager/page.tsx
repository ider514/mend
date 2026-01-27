import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LiveFeed from '@/components/manager/live-feed'
import ShiftsTable from '@/components/manager/shifts-table'
import Analytics from '@/components/manager/analytics'
import VerificationGallery from '@/components/manager/gallery'

export default async function ManagerDashboard() {
    const supabase = await createClient()

    // Fetch active shifts count
    const today = new Date().toISOString().split('T')[0]
    const { data: shifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', today)
        .is('end_time', null)

    const activeCount = shifts?.length || 0

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Одоо ажиллаж буй</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Нийт үйлдвэрлэл</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Тайлан хараахан ирээгүй байна</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Үр бүтээмж</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">--%</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Хяналт</TabsTrigger>
                    <TabsTrigger value="shifts">Цаг бүртгэл</TabsTrigger>
                    <TabsTrigger value="production">Үйлдвэрлэл</TabsTrigger>
                    <TabsTrigger value="gallery">Баталгаажуулалт</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Бодит цагийн хяналт</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LiveFeed />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="shifts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Бүх ээлж</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ShiftsTable />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="production" className="space-y-4">
                    <Analytics />
                </TabsContent>
                <TabsContent value="gallery">
                    <Card>
                        <CardHeader>
                            <CardTitle>Зургийн цомог</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <VerificationGallery />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
