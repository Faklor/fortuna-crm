import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'
import Ratings from '@/models/ratings'
import mongoose from 'mongoose'

export async function POST(request) {
    try {
        await dbConnect()
        const { workerId, type, date } = await request.json()
  

        const worker = await Workers.findById(workerId)
        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        // Создаем новую запись рейтинга
        const newRating = await Ratings.create({
            workerId: new mongoose.Types.ObjectId(workerId),
            type,
            date: new Date(date)
        })

        // Получаем первый и последний день текущего месяца
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // Получаем все рейтинги работника
        const allRatings = await Ratings.find({ workerId })


        // Получаем рейтинги за текущий месяц
        const monthlyRatings = allRatings.filter(rating => {
            const ratingDate = new Date(rating.date)
            return ratingDate >= startOfMonth && ratingDate <= endOfMonth
        })

        // Подсчитываем рейтинги
        const totalLikes = allRatings.filter(r => r.type === 'like').length
        const totalDislikes = allRatings.filter(r => r.type === 'dislike').length
        const monthlyLikes = monthlyRatings.filter(r => r.type === 'like').length
        const monthlyDislikes = monthlyRatings.filter(r => r.type === 'dislike').length

      

        // Группируем рейтинги по датам
        const ratedDatesInfo = allRatings.reduce((acc, rating) => {
            const dateStr = rating.date.toISOString().split('T')[0]
            if (!acc[dateStr]) {
                acc[dateStr] = { likes: 0, dislikes: 0 }
            }
            if (rating.type === 'like') {
                acc[dateStr].likes++
            } else {
                acc[dateStr].dislikes++
            }
            return acc
        }, {})

        return NextResponse.json({
            totalLikes,
            totalDislikes,
            totalRating: totalLikes - totalDislikes,
            monthlyLikes,
            monthlyDislikes,
            monthlyRating: monthlyLikes - monthlyDislikes,
            ratedDatesInfo
        })
    } catch (error) {
        console.error('Error in rate route:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        await dbConnect()
        const { workerId, date } = await request.json()
        
        // Создаем начало и конец дня для выбранной даты
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        // Находим и удаляем оценку за конкретный день
        await Ratings.findOneAndDelete({
            workerId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })

        return NextResponse.json({
            message: 'Оценка удалена'
        })
    } catch (error) {
        console.error('Error in rate DELETE route:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
} 