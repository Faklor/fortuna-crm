import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId


const worksSchema = new mongoose.Schema({
    id:ObjectId,
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['plowing', 'seeding', 'fertilizing', 'spraying', 'harvesting'] // типы работ
    },
    plannedDate: {
        type: Date,
        required: true
    },
    description: {
        type: String
    },
    processingArea: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]], // массив массивов координат для полигона
            required: false
        }
    },
    status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
        default: 'planned'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
    
})

worksSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.works || mongoose.model('works', worksSchema)