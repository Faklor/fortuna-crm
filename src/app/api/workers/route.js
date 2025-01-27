import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'
import Ratings from '@/models/ratings'

export async function GET() {
    try {
        await dbConnect()
        
        const workers = await Workers.find({})
        const allRatings = await Ratings.find({}).populate('createdBy', 'login name')
        
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const workersWithRatings = await Promise.all(
            workers.map(async (worker) => {
                const workerRatings = allRatings.filter(
                    rating => rating.workerId.toString() === worker._id.toString()
                )
                
                const monthlyRatings = workerRatings.filter(rating => {
                    const ratingDate = new Date(rating.date)
                    return ratingDate >= startOfMonth && ratingDate <= endOfMonth
                })

                const averageKtu = workerRatings.reduce((acc, curr) => acc + curr.ktu, 0) / workerRatings.length || 0
                const monthlyAverageKtu = monthlyRatings.reduce((acc, curr) => acc + curr.ktu, 0) / monthlyRatings.length || 0

                return {
                    ...worker.toObject(),
                    ratings: workerRatings.map(rating => ({
                        ...rating.toObject(),
                        createdBy: {
                            name: rating.createdBy?.name,
                            login: rating.createdBy?.login
                        }
                    })),
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