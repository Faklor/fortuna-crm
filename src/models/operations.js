import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const operationsSchema = new mongoose.Schema({
    id:ObjectId,
    objectID:{type:String},
    date:{type:String},
    type:{type:String},
    description:{type:String},
    periodMotor:{type:Number}
    
})

export default mongoose.models.operations || mongoose.model('operations', operationsSchema)