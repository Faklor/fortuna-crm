import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const operationsSchema = new mongoose.Schema({
    id: ObjectId,
    objectID: {type: String},
    date: {type: String},
    type: {type: String},
    description: {type: String},
    periodMotor: {type: Number},
    executors: [{ type: String }],
    createdBy: { type: String },
    usedParts: [{
        name: String,
        serialNumber: String,
        manufacturer: String,
        count: Number,
        sum: Number,
        unit: String
    }]
})

export default mongoose.models.operations || mongoose.model('operations', operationsSchema)