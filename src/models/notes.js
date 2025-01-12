import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const notesSchema = new mongoose.Schema({
    id: ObjectId,
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    image: {
        data: Buffer,
        contentType: String,
        fileName: String
    },
    season: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.models.notes || mongoose.model('notes', notesSchema)