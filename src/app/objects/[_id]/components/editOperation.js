import { useState } from "react"
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
    workers
}){
    const [periodMotor, setPeriodMotor] = useState(periodMotorCheck)
    const [descriptionOpertaion, setDescriptionOperation] = useState(description)
    const [dateEdit, setDateEdit] = useState(date)
    const [selectedExecutors, setSelectedExecutors] = useState(executors || [])
    const [partsEdit, setPartsEdit] = useState(usedParts || [])
    const [error, setError] = useState('')

    async function editOp(data){
        return await axios.post('/api/operations/edit', data)
    }

    const handleExecutorChange = (e) => {
        const value = e.target.value
        if (e.target.checked) {
            setSelectedExecutors(prev => [...prev, value])
        } else {
            setSelectedExecutors(prev => prev.filter(exec => exec !== value))
        }
    }
    
    return <div className="operation edit-mode">
        <button onClick={()=>setVisibleEdit(false)}>Назад</button>
        
        <h2>Редактирование операции</h2>
        <input 
            type='date' 
            value={dateEdit} 
            onChange={e=>setDateEdit(e.target.value)} 
            placeholder='Дата'
        />
        
        {periodMotor !== '' && 
            <input 
                type="number" 
                value={periodMotor} 
                onChange={e=>setPeriodMotor(e.target.value)}
            />
        }
        
        <textarea 
            value={descriptionOpertaion} 
            onChange={(e)=>setDescriptionOperation(e.target.value)} 
            placeholder="Введите описание выполненной операции"
        />

        {/* Множественный выбор исполнителей */}
        <div className="executors-selection">
            <h4>Исполнители:</h4>
            <div className="executors-list">
                {workers.map(worker => (
                    <label key={worker._id} className="executor-checkbox">
                        <input
                            type="checkbox"
                            value={worker.name}
                            checked={selectedExecutors.includes(worker.name)}
                            onChange={handleExecutorChange}
                        />
                        <span>{worker.name} ({worker.position})</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Отображение списка запчастей */}
        {partsEdit && partsEdit.length > 0 && (
            <div className="used-parts-list">
                <h4>Использованные запчасти:</h4>
                <ul>
                    {partsEdit.map((part, idx) => (
                        <li key={idx}>
                            {part.name} - {part.count} {part.unit}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button onClick={()=>{
            if (selectedExecutors.length === 0) {
                setError('Выберите хотя бы одного исполнителя')
                return
            }

            editOp({
                _id,
                description: descriptionOpertaion,
                periodMotor,
                date: dateEdit,
                executors: selectedExecutors,
                usedParts: partsEdit
            })
            .then(res => {
                setOperations(prev => {
                    const updated = [...prev]
                    const index = updated.findIndex(item => item._id === _id)
                    if (index !== -1) {
                        updated[index] = res.data
                    }
                    return updated
                })
                setVisibleEdit(false)
            })
            .catch(e => {
                setError(e.response?.data?.error || 'Ошибка при редактировании')
                console.error(e)
            })
        }}>Сохранить изменения</button>
    </div>
}