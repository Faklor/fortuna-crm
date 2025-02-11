import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const requisitionSchema = new mongoose.Schema({
    id: ObjectId,
    
    dateBegin: { type: String },
    dateEnd: { type: String },

    status: { type: Boolean },
    urgency: { type: String },

    requests: [{
        obj: { type: Object },
        parts: [{
            _id: { type: String },
            countReq: { type: Number },
            description: { type: String }
        }]
    }],

    description: { type: String },
    
    createdBy: {
        userId: { type: String },
        username: { type: String },
        role: { type: String }
    }
})

export default mongoose.models.requisition || mongoose.model('requisition', requisitionSchema)