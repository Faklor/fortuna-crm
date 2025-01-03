import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const historyReqSchema = new mongoose.Schema({
    id:ObjectId,
    
    dateBegin:{type:String},
    dateEnd:{type:String},

    status:{type:Boolean},
    urgency:{type:String},

    obj:{type:Object},
    parts:{type:Array},

    description:{type:String},
    
})

export default mongoose.models.historyReq || mongoose.model('historyReq', historyReqSchema)