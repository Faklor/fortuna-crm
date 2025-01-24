import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const ratingSchema = new mongoose.Schema({
    id: ObjectId,
    workerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'workers',
        required: true 
    },
    ktu: { 
        type: Number,
        required: true,
        min: 0,
        max: 2 // Предполагаем, что КТУ от 0 до 2
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
})

// Индексы для оптимизации запросов
ratingSchema.index({ workerId: 1, date: -1 })

export default mongoose.models.ratings || mongoose.model('ratings', ratingSchema) 