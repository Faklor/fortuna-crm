import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const seasonReqSchema = new mongoose.Schema({
    id:ObjectId,
    name:{ 
        type: String,
        required: true,
        unique: true
    },
    
    
}, {
    timestamps: true
})

export default mongoose.models.season || mongoose.model('season', seasonReqSchema)