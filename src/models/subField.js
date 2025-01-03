import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const subFieldsSchema = new mongoose.Schema({
    _id: ObjectId,
    geometryType: {type:String},
    coordinates: {type:Array}, 
    properties: {type:Object},
  })

export default mongoose.models.subFields || mongoose.model('subFields', subFieldsSchema)