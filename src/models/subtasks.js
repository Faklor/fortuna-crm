import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const subtasksSchema = new mongoose.Schema({
    workId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'works',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    area: {
        type: Number,
        required: true
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
        enum: ['in_progress', 'completed'],
        default: 'in_progress'
    },
    workers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
    }],
    equipment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tech'
    }],
    completedDate: {
        type: Date
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Добавляем хук для проверки общей площади подработ
subtasksSchema.pre('save', async function(next) {
    try {
        const Work = mongoose.model('works');
        const work = await Work.findById(this.workId);
        
        if (!work) {
            throw new Error('Основная работа не найдена');
        }

        // Получаем все подработы для этой работы
        const Subtask = mongoose.model('subtasks');
        const subtasks = await Subtask.find({ 
            workId: this.workId,
            _id: { $ne: this._id } // Исключаем текущую подработу
        });

        // Считаем общую площадь всех подработ + текущая
        const totalArea = subtasks.reduce((sum, task) => sum + task.area, 0) + this.area;

        if (totalArea > work.area) {
            throw new Error('Общая площадь подработ превышает площадь основной работы');
        }

        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.models.subtasks || mongoose.model('subtasks', subtasksSchema) 