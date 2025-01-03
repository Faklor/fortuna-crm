import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const fieldsSchema = new mongoose.Schema({
    _id: ObjectId,
    geometryType: {type:String},
    coordinates: {type:Array}, 
    properties: {type:Object}, 
    createdAt: {type:Date},
    seasons: {type:Array}
  })

export default mongoose.models.fields || mongoose.model('fields', fieldsSchema)