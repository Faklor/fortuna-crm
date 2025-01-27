import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'
import Ratings from '@/models/ratings'
import mongoose from 'mongoose'

export async function POST(request) {
    try {
        await dbConnect()
        const { workerId, ktu, date, comment } = await request.json()

        // Проверяем обязательные поля
        if (!workerId || !ktu || !date || !comment) {
            return NextResponse.json({ 
                error: 'Необходимо указать workerId, ktu, date и comment' 
            }, { status: 400 })
        }

        // Проверяем диапазон КТУ
        if (ktu < 0.7 || ktu > 1.3) {
            return NextResponse.json({ 
                error: 'КТУ должен быть в диапазоне от 0.7 до 1.3' 
            }, { status: 400 })
        }

        const worker = await Workers.findById(workerId)
        if (!worker) {
            return NextResponse.json({ error: 'Работник не найден' }, { status: 404 })
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
            existingRating.comment = comment
            newRating = await existingRating.save()
        } else {
            // Создаем новую запись
            newRating = await Ratings.create({
                workerId: new mongoose.Types.ObjectId(workerId),
                ktu,
                date: new Date(date),
                comment
            })
        }

        // Получаем все рейтинги работника с комментариями
        const allRatings = await Ratings.find({ workerId })
            .sort({ date: -1 }) // Сортируем по дате (новые первые)
            .select('ktu date comment') // Выбираем нужные поля

        // Получаем рейтинги за текущий месяц
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const monthlyRatings = allRatings.filter(rating => {
            const ratingDate = new Date(rating.date)
            return ratingDate >= startOfMonth && ratingDate <= endOfMonth
        })

        // Рассчитываем средние значения КТУ
        const averageKtu = allRatings.reduce((acc, curr) => acc + curr.ktu, 0) / allRatings.length || 0
        const monthlyAverageKtu = monthlyRatings.reduce((acc, curr) => acc + curr.ktu, 0) / monthlyRatings.length || 0

        return NextResponse.json({
            rating: {
                currentKtu: newRating.ktu,
                date: newRating.date,
                comment: newRating.comment
            },
            statistics: {
                averageKtu,
                monthlyAverageKtu,
                ratingsCount: allRatings.length,
                monthlyRatingsCount: monthlyRatings.length
            },
            history: allRatings.map(rating => ({
                ktu: rating.ktu,
                date: rating.date,
                comment: rating.comment
            }))
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
        
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        // Находим и удаляем оценку за конкретный день
        const deletedRating = await Ratings.findOneAndDelete({
            workerId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })

        if (!deletedRating) {
            return NextResponse.json({ 
                error: 'Оценка не найдена' 
            }, { status: 404 })
        }

        return NextResponse.json({
            message: 'Оценка успешно удалена',
            deletedRating: {
                ktu: deletedRating.ktu,
                date: deletedRating.date,
                comment: deletedRating.comment
            }
        })
    } catch (error) {
        console.error('Error in rate DELETE route:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
} 