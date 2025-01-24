import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'
import Ratings from '@/models/ratings'
import mongoose from 'mongoose'

export async function POST(request) {
    try {
        await dbConnect()
        const { workerId, ktu, date } = await request.json()

        const worker = await Workers.findById(workerId)
        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        // Создаем или обновляем запись КТУ
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        // Проверяем существование записи за этот день
        const existingRating = await Ratings.findOne({
            workerId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })

        let newRating
        if (existingRating) {
            // Обновляем существующую запись
            existingRating.ktu = ktu
            newRating = await existingRating.save()
        } else {
            // Создаем новую запись
            newRating = await Ratings.create({
                workerId: new mongoose.Types.ObjectId(workerId),
                ktu,
                date: new Date(date)
            })
        }

        // Получаем статистику по КТУ
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // Получаем все рейтинги работника
        const allRatings = await Ratings.find({ workerId })
        const monthlyRatings = allRatings.filter(rating => {
            const ratingDate = new Date(rating.date)
            return ratingDate >= startOfMonth && ratingDate <= endOfMonth
        })

        // Рассчитываем средние значения КТУ
        const averageKtu = allRatings.reduce((acc, curr) => acc + curr.ktu, 0) / allRatings.length || 0
        const monthlyAverageKtu = monthlyRatings.reduce((acc, curr) => acc + curr.ktu, 0) / monthlyRatings.length || 0

        return NextResponse.json({
            currentKtu: newRating.ktu,
            averageKtu,
            monthlyAverageKtu,
            ratingsCount: allRatings.length,
            monthlyRatingsCount: monthlyRatings.length
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