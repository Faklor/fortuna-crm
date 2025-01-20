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
    organization: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    startDate: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Виртуальное поле для расчета стажа
workersSchema.virtual('experience').get(function() {
    const years = Math.floor((new Date() - this.startDate) / (1000 * 60 * 60 * 24 * 365))
    return years
})

export default mongoose.models.workers || mongoose.model('workers', workersSchema)