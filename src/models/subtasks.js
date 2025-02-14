import mongoose from 'mongoose'
const ObjectId = mongoose.Schema.ObjectId

const subtasksSchema = new mongoose.Schema({
    workId: { type: mongoose.Schema.Types.ObjectId, required: true },
    plannedDate: { type: Date, required: true },
    area: { type: Number, default: null },
    status: { type: String, default: 'in_progress' },
    workers: [{
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: { type: String, required: true }
    }],
    equipment: [{
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        category: { type: String },
        captureWidth: { type: Number }
    }],
    tracks: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

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