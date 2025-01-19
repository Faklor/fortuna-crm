import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'

export async function GET() {
    try {
        await dbConnect()
        // Получаем уникальные организации
        const organizations = await Workers.distinct('organization')
        return NextResponse.json(organizations)
    } catch (error) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch organizations' }, 
            { status: 500 }
        )
    }
} 