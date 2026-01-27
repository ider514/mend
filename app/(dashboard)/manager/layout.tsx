import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'

export default async function ManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    // Strict role check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'manager' && profile?.role !== 'superuser') {
        redirect('/employee')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight">Mendmn Manager</h1>
                    <div className="text-sm px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                        {profile.role.toUpperCase()}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{user.email}</span>
                    <form action={logout}>
                        <Button variant="outline" size="sm">Гарах</Button>
                    </form>
                </div>
            </nav>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
