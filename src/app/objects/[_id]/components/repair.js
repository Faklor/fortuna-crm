import axios from "axios"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const UNITS = ['шт.', 'л.', 'см.', 'м.']

export default function Repair({
    setVisibleAddOperation, 
    type,
    objectID,
    category,
    setOperations,
    setTypeOperation,
    listTypesOperations,
    workers,
    parts
}){

    //navigation
    const router = useRouter()
    //default
    const defaultDate = new Date().toLocaleDateString()

    function formatDate(inputDate) {
        const parts = inputDate.split('.');
        if (parts.length !== 3) {
          return 'Некорректный формат даты';
        }
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    }
    //react
    const [dateOpertaion, setDateOperation]  = useState(formatDate(defaultDate))
    const [descriptionOpertaion, setDescriptionOperation] = useState('')
    const [periodMotor, setPeriodMotor] = useState('')
    const [executor, setExecutor] = useState('')
    const [selectedParts, setSelectedParts] = useState([])
    const [partValues, setPartValues] = useState({})
    const [selectedUnits, setSelectedUnits] = useState({})
    const [showPartsSelector, setShowPartsSelector] = useState(false)
    const [searchParts, setSearchParts] = useState('')
    const [err, setErr] = useState('')

    // Получаем текущего пользователя из сессии
    const [currentUser, setCurrentUser] = useState(null)
    
    useEffect(() => {
        // Получаем данные о текущем пользователе
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(session => {
                if (session?.user) {
                    setCurrentUser(session.user)
                }
            })
    }, [])

    // Получаем список доступных запчастей
    useEffect(() => {
        axios.get('/api/parts')
            .then(res => setAvailableParts(res.data))
            .catch(e => console.log(e))
    }, [])

    // Фильтруем запчасти по поиску
    const filteredParts = parts.filter(part => 
        part.name.toLowerCase().includes(searchParts.toLowerCase())
    )

    // Обработчики для запчастей
    const handleCheckboxChange = (event, partId) => {
        const isChecked = event.target.checked
        if (isChecked) {
            setSelectedParts(prev => [...prev, partId])
        } else {
            setSelectedParts(prev => prev.filter(id => id !== partId))
            // Очищаем значения при снятии выбора
            const newPartValues = { ...partValues }
            const newSelectedUnits = { ...selectedUnits }
            delete newPartValues[partId]
            delete newSelectedUnits[partId]
            setPartValues(newPartValues)
            setSelectedUnits(newSelectedUnits)
        }
    }

    const handleNumberInputChange = (event, partId) => {
        const value = event.target.value
        if (value === '' || (Number(value) >= 0 && Number(value) <= parts.find(p => p._id === partId).count)) {
            setPartValues(prev => ({ ...prev, [partId]: value }))
        }
    }

    const handleUnitChange = (e, partId) => {
        setSelectedUnits(prev => ({ ...prev, [partId]: e.target.value }))
    }

    // Функция добавления операции с запчастями
    async function addOperation(data){
        // Подготавливаем данные о запчастях
        const usedParts = selectedParts.map(partId => {
            const part = parts.find(p => p._id === partId)
            return {
                _id: partId,
                name: part.name,
                catagory: part.catagory,        // Добавляем категорию
                serialNumber: part.serialNumber,
                sellNumber: part.sellNumber,     // Добавляем номер продажи
                manufacturer: part.manufacturer,
                count: Number(partValues[partId]),
                unit: selectedUnits[partId],
                sum: part.sum,
                contact: part.contact           // Добавляем контактную информацию
            }
        }).filter(part => part.count > 0)

        // Отправляем запрос на создание операции
        const operationResponse = await axios.post('/api/operations/add', {
            objectID,
            date: data.date,
            type,
            description: data.description,
            periodMotor: data.periodMotor,
            executor: data.executor,
            createdBy: currentUser?.login || 'unknown',
            usedParts
        })

        // Если есть запчасти, списываем их
        if (usedParts.length > 0) {
            await axios.post('/api/parts/writeOff', {
                parts: usedParts,
                objectID,
                date: data.date,
                workerName: data.executor
            })
        }

        return operationResponse
    }

    const categoryUnit = category === '🔆 Комбайны' || category === '💧 Опрыскиватели' || category === '🚜 Трактора' || category === '📦 Погрущики' ? 'м.ч.' : 'км.'

    return <div className="add">
        <p>Дата ремонта</p>
        <input type='date' value={dateOpertaion} onChange={e=>setDateOperation(e.target.value)}/>

        <p>Показания счетчика ({categoryUnit})</p>
        <input 
            type='number' 
            value={periodMotor} 
            onChange={e=>setPeriodMotor(e.target.value)}
            placeholder={`Введите ${categoryUnit}`}
        />

        <p>Исполнитель</p>
        <select 
            value={executor} 
            onChange={e => setExecutor(e.target.value)}
            required
        >
            <option value="">Выберите исполнителя</option>
            {workers.map(worker => (
                <option key={worker._id} value={worker.name}>
                    {worker.name} ({worker.position})
                </option>
            ))}
        </select>

        <textarea 
            value={descriptionOpertaion} 
            onChange={e=>setDescriptionOperation(e.target.value)} 
            placeholder='Введите описание выполненной операции'
        />

        <div className="parts-section">
            <button 
                onClick={() => setShowPartsSelector(!showPartsSelector)}
                className="toggle-parts-btn"
            >
                {showPartsSelector ? 'Скрыть запчасти' : 'Добавить запчасти'}
            </button>
            
            {showPartsSelector && (
                <div className="parts-selector">
                    <div className="search-container">
                        <input 
                            type="text"
                            placeholder="🔍 Поиск запчастей..."
                            value={searchParts}
                            onChange={(e) => setSearchParts(e.target.value)}
                            className="search-input"
                        />
                        {searchParts && (
                            <button 
                                className="clear-search"
                                onClick={() => setSearchParts('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="parts-grid">
                        {filteredParts.map(part => (
                            <div key={part._id} className="part-card">
                                <div className="part-header">
                                    <input 
                                        type="checkbox"
                                        checked={selectedParts.includes(part._id)}
                                        onChange={(e) => handleCheckboxChange(e, part._id)}
                                    />
                                    <span>{part.name} (В наличии: {part.count})</span>
                                </div>
                                
                                {selectedParts.includes(part._id) && (
                                    <div className="part-details">
                                        <input 
                                            type="number"
                                            min="0"
                                            max={part.count}
                                            value={partValues[part._id] || ''}
                                            onChange={(e) => handleNumberInputChange(e, part._id)}
                                            placeholder="Количество"
                                        />
                                        <select 
                                            value={selectedUnits[part._id] || ''}
                                            onChange={(e) => handleUnitChange(e, part._id)}
                                        >
                                            <option value="">Ед. изм.</option>
                                            {UNITS.map(unit => (
                                                <option key={unit} value={unit}>
                                                    {unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {err && <div className="error-message">{err}</div>}
        </div>
            
        <button onClick={async()=>{
            addOperation({
                date: dateOpertaion,
                description: descriptionOpertaion,
                periodMotor: periodMotor,
                executor: executor,
                selectedParts: selectedParts
            })
            .then(res => {
                setOperations(prev => [...prev, res.data])
                router.push(`/objects/${objectID}`)
                setTypeOperation(listTypesOperations[0])
            })
            .catch(e => console.log(e))
        }}>Добавить</button>
    </div>
}