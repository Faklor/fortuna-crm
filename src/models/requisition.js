import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const requisitionSchema = new mongoose.Schema({
    id:ObjectId,
    
    dateBegin:{type:String},
    dateEnd:{type:String},

    status:{type:Boolean},
    urgency:{type:String},

    obj:{type:Object},
    parts:{type:Array},

    description:{type:String},
    
})

export default mongoose.models.requisition || mongoose.model('requisition', requisitionSchema)