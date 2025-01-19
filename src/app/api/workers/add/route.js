import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'

export async function POST(request) {
    try {
        await dbConnect()
        const data = await request.json()
        
        // Создаем нового работника
        const worker = await Workers.create({
            name: data.name,
            position: data.position,
            organization: data.organization,
            phone: data.phone || '',
            email: data.email || '',
            ratings: [],
            totalLikes: 0,
            totalDislikes: 0,
            rating: 0
        })

        return NextResponse.json(worker)
    } catch (error) {
        console.error('Error creating worker:', error)
        return NextResponse.json(
            { error: 'Failed to create worker' }, 
            { status: 500 }
        )
    }
}