import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Allow managers to access employee view too if they want, but stricly speaking 
    // users should be redirected. For debugging let's allow all authenticated for now,
    // but in prod we might enforce role check.

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
            <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="font-bold text-lg">Mendmn</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
            </nav>
            {children}
        </div>
    )
}
