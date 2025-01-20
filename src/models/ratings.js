import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const ratingSchema = new mongoose.Schema({
    id: ObjectId,
    workerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'workers',
        required: true 
    },
    type: { 
        type: String, 
        enum: ['like', 'dislike'],
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
})

// Индексы для оптимизации запросов
ratingSchema.index({ workerId: 1, date: -1 })

export default mongoose.models.ratings || mongoose.model('ratings', ratingSchema) 