import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'

export async function GET() {
    try {
        await dbConnect()
        // Получаем уникальные должности
        const positions = await Workers.distinct('position')
        return NextResponse.json(positions)
    } catch (error) {
        console.error('Error fetching positions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch positions' }, 
            { status: 500 }
        )
    }
} 