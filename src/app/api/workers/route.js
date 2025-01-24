import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'
import Ratings from '@/models/ratings'
import mongoose from 'mongoose'

export async function GET() {
    try {
        await dbConnect()
        
        // Получаем всех работников
        const workers = await Workers.find({})
        
        // Получаем первый и последний день текущего месяца
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        
        // console.log('Date range for ratings:', {
        //     startOfMonth: startOfMonth.toISOString(),
        //     endOfMonth: endOfMonth.toISOString()
        // })

        // Получаем все рейтинги
        const allRatings = await Ratings.find({})
        //console.log('All ratings:', allRatings)

        const workersWithRatings = await Promise.all(
            workers.map(async (worker) => {
                // Фильтруем рейтинги для текущего работника
                const workerRatings = allRatings.filter(
                    rating => rating.workerId.toString() === worker._id.toString()
                )
                
                // Фильтруем рейтинги за текущий месяц
                const monthlyRatings = workerRatings.filter(rating => {
                    const ratingDate = new Date(rating.date)
                    return ratingDate >= startOfMonth && ratingDate <= endOfMonth
                })

                // console.log(`Ratings for worker ${worker._id}:`, {
                //     allRatings: workerRatings,
                //     monthlyRatings: monthlyRatings
                // })

                // Рассчитываем средние КТУ
                const averageKtu = workerRatings.reduce((acc, curr) => acc + curr.ktu, 0) / workerRatings.length || 0
                const monthlyAverageKtu = monthlyRatings.reduce((acc, curr) => acc + curr.ktu, 0) / monthlyRatings.length || 0

                return {
                    ...worker.toObject(),
                    averageKtu,
                    monthlyAverageKtu,
                    ratingsCount: workerRatings.length,
                    monthlyRatingsCount: monthlyRatings.length
                }
            })
        )

        return NextResponse.json(workersWithRatings)
    } catch (error) {
        console.error('Error in workers route:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}