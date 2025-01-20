import dbConnect from "@/lib/db";
import Workers from "@/models/workers";
import Ratings from "@/models/ratings";

//----------components------------
import WorkersList from './components/WorkersList'

export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function WorkersPage() {
    await dbConnect()
    
    const workers = await Workers.find({})
    const allRatings = await Ratings.find({})
    
    // Получаем текущий месяц для начальной фильтрации
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Получаем рейтинги для всех работников со всеми данными
    const workersWithRatings = await Promise.all(
        workers.map(async (worker) => {
            const workerRatings = allRatings.filter(
                rating => rating.workerId.toString() === worker._id.toString()
            )
            
            // Группируем рейтинги по месяцам для быстрого доступа
            const ratingsByMonth = workerRatings.reduce((acc, rating) => {
                const date = new Date(rating.date)
                const key = `${date.getFullYear()}-${date.getMonth() + 1}`
                
                if (!acc[key]) {
                    acc[key] = {
                        likes: 0,
                        dislikes: 0,
                        ratings: []
                    }
                }
                
                if (rating.type === 'like') acc[key].likes++
                else acc[key].dislikes++
                
                acc[key].ratings.push(rating)
                return acc
            }, {})

            // Общие рейтинги
            const totalLikes = workerRatings.filter(r => r.type === 'like').length
            const totalDislikes = workerRatings.filter(r => r.type === 'dislike').length
            
            return {
                ...worker.toObject(),
                ratings: workerRatings,
                ratingsByMonth,
                totalLikes,
                totalDislikes,
                totalRating: totalLikes - totalDislikes
            }
        })
    )
    
    return (
        <WorkersList 
            visibleWorkers={JSON.stringify(workersWithRatings)}
            initialStartDate={startOfMonth.toISOString()}
            initialEndDate={endOfMonth.toISOString()}
        />
    )
}


