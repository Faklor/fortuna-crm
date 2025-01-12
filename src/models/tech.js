import mongoose from 'mongoose'

const techSchema = new mongoose.Schema({
    id: { type: Number },
    name: { type: String },
    icon: {
        data: Buffer,
        contentType: String,
        fileName: String
    },
    catagory: { type: String },
    inspection: { type: Object },
    maintance: {
        type: Object, 
        default: {}
    },
    organization: { type: String },
    history: [
        {
            date: { type: Date, default: Date.now }, 
            user: { type: String }, 
            type: { type: String }, 
            text: { type: String }
        }
    ],
    description: { type: String },
    bindingParts: { type: Array }
})

export default mongoose.models.tech || mongoose.model('tech', techSchema)

