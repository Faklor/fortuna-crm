import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const workersSchema = new mongoose.Schema({
    id:ObjectId,
    name:{type:String}
})

export default mongoose.models.workers || mongoose.model('workers', workersSchema)