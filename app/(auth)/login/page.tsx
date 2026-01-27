'use client'

import { useState } from 'react'
import { login } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await login(formData)
        setLoading(false)
        if (res?.error) {
            toast.error(res.error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md shadow-lg border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center tracking-tight">Mendmn Staff</CardTitle>
                    <CardDescription className="text-center">
                        Системд нэвтрэх
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Имэйл хаяг</Label>
                            <Input id="email" name="email" type="email" placeholder="name@mendmn.mn" required className="bg-white dark:bg-zinc-900" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Нууц үг</Label>
                            <Input id="password" name="password" type="password" required className="bg-white dark:bg-zinc-900" />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Нэвтрэх
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
