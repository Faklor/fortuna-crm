import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const usersReqSchema = new mongoose.Schema({
    id:ObjectId,
    login:{type:String, require:[true],unique:true},
    role:{type:String},
    password:{type:String},
    
})

export default mongoose.models.users || mongoose.model('users', usersReqSchema)