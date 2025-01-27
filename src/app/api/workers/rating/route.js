import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Ratings from '@/models/ratings'
import Users from '@/models/users' // Добавляем модель пользователей

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const date = new Date(searchParams.get('date'))

    try {
        await dbConnect()

        const startOfDay = new Date(date.setHours(0, 0, 0, 0))
        const endOfDay = new Date(date.setHours(23, 59, 59, 999))

        const rating = await Ratings.findOne({
            workerId: workerId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('createdBy', 'login name')

        return NextResponse.json({ rating })
    } catch (error) {
        console.error('Error fetching rating:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        await dbConnect()
        const data = await request.json()
        
        const rating = await Ratings.create(data)
        const populatedRating = await rating.populate('createdBy', 'login name')
        
        return NextResponse.json(populatedRating)
    } catch (error) {
        console.error('Error creating rating:', error)
        return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        await dbConnect()
        const data = await request.json()
        
        const startOfDay = new Date(data.date)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(data.date)
        endOfDay.setHours(23, 59, 59, 999)

        const result = await Ratings.deleteOne({
            workerId: data.workerId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })

        return NextResponse.json({ success: true, result })
    } catch (error) {
        console.error('Error deleting rating:', error)
        return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 })
    }
} 