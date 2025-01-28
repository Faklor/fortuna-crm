import { useState, useEffect } from "react"
import axios from "axios"
import '../scss/editOperation.scss'

export default function EditOperation({
    _id, 
    setVisibleEdit, 
    description, 
    periodMotorCheck, 
    date,
    executors,
    usedParts,
    setOperations,
    workers,
    parts,
    type,
    category
}){
    const [editDescription, setEditDescription] = useState(description)
    const [editPeriodMotor, setEditPeriodMotor] = useState(periodMotorCheck || '0')
    const [editDate, setEditDate] = useState(date)
    const [selectedExecutors, setSelectedExecutors] = useState(executors || [])
    const [editUsedParts, setEditUsedParts] = useState(usedParts || [])
    const [showExecutorModal, setShowExecutorModal] = useState(false)
    const [newExecutor, setNewExecutor] = useState('')
    const [err, setErr] = useState('')

    const categoryTech = category === '🔆 Комбайны' || 
                        category === '💧 Опрыскиватели' || 
                        category === '🚜 Трактора' || 
                        category === '📦 Погрущики' ? 'м.ч.' : 'км.'

    async function editOperation(){
        if (selectedExecutors.length === 0) {
            setErr('Должен быть хотя бы один исполнитель')
            return
        }

        try {
            const res = await axios.post('/api/operations/edit', {
                _id,
                description: editDescription,
                periodMotor: editPeriodMotor,
                date: editDate,
                executors: selectedExecutors,
                usedParts: editUsedParts
            })
            
            setOperations(prev => prev.map(operation => 
                operation._id === _id ? res.data : operation
            ))
            setVisibleEdit(false)
        } catch(e) {
            console.error(e)
            setErr(e.response?.data?.error || 'Ошибка при редактировании')
        }
    }

    return <div className="operation edit-mode">
        <button onClick={() => setVisibleEdit(false)}>Назад</button>
        
        <h2>Редактирование операции</h2>
        <input 
            type='date' 
            value={editDate} 
            onChange={e => setEditDate(e.target.value)} 
        />
        
        {/* Показываем поле счетчика для всех типов операций */}
        <div>
            <p>Показания счетчика ({categoryTech})</p>
            <input 
                type="number" 
                value={editPeriodMotor} 
                onChange={e => setEditPeriodMotor(e.target.value)}
                placeholder={`Введите ${categoryTech}`}
            />
        </div>
        
        <textarea 
            value={editDescription} 
            onChange={e => setEditDescription(e.target.value)} 
            placeholder="Описание операции"
        />

        {/* Секция исполнителей */}
        <div className="executors-section">
            <div className="executors-header">
                <h4>Исполнители:</h4>
                <button onClick={() => setShowExecutorModal(true)}>
                    Добавить исполнителя
                </button>
            </div>

            {/* Список выбранных исполнителей */}
            <div className="selected-executors">
                {selectedExecutors.map((executor, idx) => (
                    <div key={idx} className="selected-executor">
                        {executor}
                        <button onClick={() => removeExecutor(executor)}>✕</button>
                    </div>
                ))}
            </div>

            {/* Модальное окно добавления исполнителя */}
            {showExecutorModal && (
                <div className="executor-modal">
                    <div className="modal-content">
                        <h4>Добавить исполнителя</h4>
                        
                        {/* Список доступных работников */}
                        {availableWorkers.length > 0 && (
                            <div className="available-workers">
                                <h5>Выберите из списка:</h5>
                                {availableWorkers.map(worker => (
                                    <button 
                                        key={worker._id}
                                        onClick={() => addExecutor(worker.name)}
                                        className="worker-button"
                                    >
                                        {worker.name} ({worker.position})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Ручной ввод */}
                        <div className="manual-input">
                            <h5>Или введите вручную:</h5>
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={newExecutor}
                                    onChange={e => setNewExecutor(e.target.value)}
                                    placeholder="Введите ФИО или организацию"
                                />
                                <button 
                                    onClick={() => addExecutor(newExecutor.trim())}
                                    disabled={!newExecutor.trim()}
                                >
                                    Добавить
                                </button>
                            </div>
                        </div>

                        <button 
                            className="close-modal"
                            onClick={() => setShowExecutorModal(false)}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Секция запчастей */}
        {editUsedParts && editUsedParts.length > 0 && (
            <div className="used-parts-section">
                <h4>Использованные запчасти:</h4>
                <div className="parts-list">
                    {editUsedParts.map((part, idx) => {
                        const stockPart = parts.find(p => p._id === part._id)
                        
                        return (
                            <div key={idx} className="part-item">
                                <div className="part-info">
                                    <span className="part-name">{part.name}</span>
                                    <span className="stock-info">
                                        На складе: {stockPart ? stockPart.count : '...'}
                                    </span>
                                </div>
                                <div className="part-count">
                                    <input
                                        type="number"
                                        min="0"
                                        max={stockPart ? stockPart.count : 0}
                                        value={part.count}
                                        onChange={e => handlePartCountChange(
                                            part._id,
                                            Number(e.target.value)
                                        )}
                                    />
                                    <span>{part.unit}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {err && <div className="error-message">{err}</div>}

        <div className="edit-buttons">
            <button onClick={editOperation}>Сохранить</button>
            <button onClick={() => setVisibleEdit(false)}>Отмена</button>
        </div>
    </div>
}