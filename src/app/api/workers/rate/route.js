import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'

export async function POST(request) {
    try {
        await dbConnect()
        const { workerId, type } = await request.json()
        
        const worker = await Workers.findById(workerId)
        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        await worker.addRating(type)
        
        // Получаем обновленного работника
        const updatedWorker = await Workers.findById(workerId)
        
        return NextResponse.json({
            totalLikes: updatedWorker.totalLikes,
            totalDislikes: updatedWorker.totalDislikes,
            rating: updatedWorker.rating // виртуальное поле
        })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
} 