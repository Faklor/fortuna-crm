import { NextResponse } from 'next/server'
import dbConnect from "@/lib/db"
import Workers from "@/models/workers"
import Ratings from "@/models/ratings"

export async function GET() {
    try {
        await dbConnect()
        
        const workers = await Workers.find({})
        const allRatings = await Ratings.find({})
        
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        
        const workersWithRatings = workers.map(worker => {
            const workerRatings = allRatings.filter(
                rating => rating.workerId.toString() === worker._id.toString()
            )
            
            const monthlyRatings = workerRatings.filter(rating => {
                const ratingDate = new Date(rating.date)
                return ratingDate >= startOfMonth && ratingDate <= endOfMonth
            })
            
            const monthlyLikes = monthlyRatings.filter(r => r.type === 'like').length
            const monthlyDislikes = monthlyRatings.filter(r => r.type === 'dislike').length
            const totalLikes = workerRatings.filter(r => r.type === 'like').length
            const totalDislikes = workerRatings.filter(r => r.type === 'dislike').length
            
            return {
                ...worker.toObject(),
                ratings: workerRatings,
                monthlyLikes,
                monthlyDislikes,
                monthlyRating: monthlyLikes - monthlyDislikes,
                totalLikes,
                totalDislikes,
                totalRating: totalLikes - totalDislikes
            }
        })
        
        return NextResponse.json(workersWithRatings)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
} 