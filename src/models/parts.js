import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const partsSchema = new mongoose.Schema({
    id:ObjectId,
    name:{type:String},
    catagory:{type: String},
    serialNumber:{type:String},
    sellNumber:{type:String},
    manufacturer:{type:String},
    count:{type:Number},
    sum:{type:Number},
    contact:{type:Object},
    bindingObj:{type:Array},
    storageId:{type:String}
})

export default mongoose.models.parts || mongoose.model('parts', partsSchema)