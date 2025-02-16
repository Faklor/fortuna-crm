import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const worksSchema = new mongoose.Schema({
    id: ObjectId,
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
        enum: [
            'organic_fertilizing',    // Внесение органических удобрений
            'mineral_fertilizing',    // Внесение минеральных удобрений
            'harrowing',             // Боронование
            'deep_loosening',        // Глубокое рыхление
            'disking',               // Дискование
            'cultivation',           // Культивация
            'peeling',               // Лущение
            'plowing',               // Вспашка
            'rolling',               // Прокатывание
            'seeding',               // Посев
            'planting',              // Посадка
            'chemical_treatment',     // Хим. обработка
            'spraying',              // Опрыскивание
            'harvesting',            // Уборка
            'chiseling',             // Чизелевание
            'stone_separation',       // Сепарация камней
            'ridge_cutting'          // Нарезка гребней
        ]
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
    completedDate: {
        type: Date,
        default: function() {
            return this.status === 'completed' ? new Date() : null;
        }
    },
    area: { type: Number, required: true },
    areaSelectionType: {
        type: String,
        default: 'custom'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    workers: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Worker'
        },
        name: String
    }],
    equipment: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tech'
        },
        name: String,
        category: String,
        captureWidth: Number
    }]
})

worksSchema.pre('save', function(next) {
    if (this.status === 'completed' && !this.completedDate) {
        this.completedDate = new Date();
    }
    this.updatedAt = new Date();
    next();
});

worksSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.status === 'completed' && !update.completedDate) {
        update.completedDate = new Date();
    }
    next();
});

export default mongoose.models.works || mongoose.model('works', worksSchema)