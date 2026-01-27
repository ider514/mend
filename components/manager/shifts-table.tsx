import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default async function ShiftsTable() {
    const supabase = await createClient()
    const { data: shifts } = await supabase
        .from('shifts')
        .select('*, profiles(full_name)')
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50)

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ажилтан</TableHead>
                        <TableHead>Огноо</TableHead>
                        <TableHead>Ирсэн</TableHead>
                        <TableHead>Гарсан</TableHead>
                        <TableHead>Үргэлжилсэн</TableHead>
                        <TableHead className="text-right">Үйлдэл</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shifts?.map((shift) => (
                        <TableRow key={shift.id}>
                            <TableCell className="font-medium">{shift.profiles?.full_name || '?'}</TableCell>
                            <TableCell>{shift.date}</TableCell>
                            <TableCell>{format(new Date(shift.start_time), 'HH:mm')}</TableCell>
                            <TableCell>{shift.end_time ? format(new Date(shift.end_time), 'HH:mm') : '-'}</TableCell>
                            <TableCell>
                                {/* Duration Calc Placeholder */}
                                {shift.end_time ?
                                    ((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1) + 'цаг'
                                    : '...'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">Засах</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
