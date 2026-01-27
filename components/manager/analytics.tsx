'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const data = [
    {
        name: "Дав",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
    {
        name: "Мяг",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
    {
        name: "Лха",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
    {
        name: "Пүр",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
    {
        name: "Баа",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
    {
        name: "Бям",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
    {
        name: "Ням",
        total: Math.floor(Math.random() * 5000) + 1000,
    },
]

export default function Analytics() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Үйлдвэрлэлийн хандлага</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Bar
                            dataKey="total"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
