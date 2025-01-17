import mongoose from 'mongoose'

const techSchema = new mongoose.Schema({
    id: { type: Number },
    name: { type: String },
    icon: {
        fileName: {
            type: String,
            default: 'Default.png'
        },
        contentType: {
            type: String,
            default: 'image/png'
        }
    },
    catagory: { type: String },
    captureWidth: { 
        type: Number,
        default: function() {
            return this.catagory === '🚃 Прицепы' ? 0 : null;
        }
    },
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

