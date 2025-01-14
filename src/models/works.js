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
    area: { type: Number, required: true },
    areaSelectionType: {
        type: String,
        enum: ['full', 'subfield', 'custom'],
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
    }],
    equipment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tech'
    }]
})

worksSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.works || mongoose.model('works', worksSchema)