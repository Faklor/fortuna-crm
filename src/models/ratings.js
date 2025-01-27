import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const ratingSchema = new mongoose.Schema({
    id: ObjectId,
    workerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'workers',
        required: true 
    },
    createdBy: {  // Меняем на строку для хранения логина
        type: String,
        required: true
    },
    ktu: { 
        type: Number,
        required: true,
        min: 0.1,    // Минимальное значение КТУ
        max: 1.3     // Максимальное значение КТУ
    },
    comment: {       // Добавляем поле для комментария
        type: String,
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