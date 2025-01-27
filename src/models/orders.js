import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const ordersSchema = new mongoose.Schema({
    id:ObjectId,
    date:{type:String},
    workerName:{type:String},
    objectID:{type:String},
    part:{type:Object},
    countPart:{type:Number},
    description:{type:String},
    operationType: { 
        type: String, 
        enum: ['operation', 'manual', 'request'], // operation - после операции, manual - выдача со склада, request - после заявки
        default: 'manual'
    }
})

export default mongoose.models.orders || mongoose.model('orders', ordersSchema)