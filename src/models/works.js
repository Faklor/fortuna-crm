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
            required: true
        },
        coordinates: {
            type: [[[Number]]],
            required: true
        }
    },
    status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
        default: 'planned',
        get: function(status) {
            const statusMap = {
                'planned': 'Запланировано',
                'in_progress': 'В процессе',
                'completed': 'Завершено',
                'cancelled': 'Отменено'
            };
            return statusMap[status] || status;
        }
    },
    area: { type: Number, required: true },
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