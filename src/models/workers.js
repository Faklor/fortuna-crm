import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

// Схема для оценок
const ratingSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['like', 'dislike'] },
    comment: { type: String }, // опционально для комментария
})

const workersSchema = new mongoose.Schema({
    id: ObjectId,
    name: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    ratings: [ratingSchema], // массив оценок
    // Вычисляемые поля для рейтинга
    totalLikes: { type: Number, default: 0 },
    totalDislikes: { type: Number, default: 0 },
    // Дата начала работы для расчета стажа
    startDate: { type: Date, default: Date.now }
}, {
    // Добавляем виртуальные поля
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Виртуальное поле для расчета общего рейтинга
workersSchema.virtual('rating').get(function() {
    return this.totalLikes - this.totalDislikes
})

// Виртуальное поле для расчета стажа
workersSchema.virtual('experience').get(function() {
    const years = Math.floor((new Date() - this.startDate) / (1000 * 60 * 60 * 24 * 365))
    return years
})

// Метод для добавления оценки
workersSchema.methods.addRating = function(type, comment = '') {
    this.ratings.push({ type, comment })
    if (type === 'like') this.totalLikes += 1
    if (type === 'dislike') this.totalDislikes += 1
    return this.save()
}

// Метод для получения рейтинга за период
workersSchema.methods.getRatingForPeriod = function(startDate, endDate = new Date()) {
    const periodRatings = this.ratings.filter(rating => 
        rating.date >= startDate && rating.date <= endDate
    )
    
    return {
        likes: periodRatings.filter(r => r.type === 'like').length,
        dislikes: periodRatings.filter(r => r.type === 'dislike').length,
        total: periodRatings.filter(r => r.type === 'like').length - 
               periodRatings.filter(r => r.type === 'dislike').length
    }
}

export default mongoose.models.workers || mongoose.model('workers', workersSchema)