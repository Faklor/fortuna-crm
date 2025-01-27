import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const usersReqSchema = new mongoose.Schema({
    id: ObjectId,
    login: { type: String, require: [true], unique: true },
    role: { 
        type: String,
        enum: ['admin', 'manager', 'worker', 'warehouse'],
        default: 'worker'
    },
    password: { type: String },
    active: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
})

export default mongoose.models.users || mongoose.model('users', usersReqSchema)