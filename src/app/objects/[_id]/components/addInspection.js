import axios from "axios"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"

export default function AddInspection({ 
    period, 
    type, 
    objectID, 
    setOperations,
    listTypesOperations,
    setTypeOperation,
    workers,    
    parts
}){
    
    //navigation
    const router = useRouter()
    const { data: session } = useSession()
    //default
    const defaultDate = new Date().toLocaleDateString()
    const UNITS = ['шт.', 'л.', 'см.', 'м.']

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
    const [periodOperation, setPeriod] = useState(period)
    const [beginDateOperation, setBeginDate] = useState(formatDate(defaultDate))
    const [descriptionOpertaion, setDescriptionOperation] = useState('')
    
    // Обновляем состояния для исполнителей
    const [selectedExecutors, setSelectedExecutors] = useState([])
    const [customExecutors, setCustomExecutors] = useState(['']) // Массив для ручного ввода
    const [selectedParts, setSelectedParts] = useState([])
    const [partValues, setPartValues] = useState({})
    const [selectedUnits, setSelectedUnits] = useState({})
    const [showPartsSelector, setShowPartsSelector] = useState(false)
    const [searchParts, setSearchParts] = useState('')
    const [err, setErr] = useState('')

    // Добавляем состояние для текущего пользователя
    const [currentUser, setCurrentUser] = useState(null)
    
    // Получаем текущего пользователя из сессии
    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(session => {
                if (session?.user) {
                    setCurrentUser(session.user)
                }
            })
    }, [])

    // Функция добавления поля для ручного ввода
    const addCustomExecutorField = () => {
        setCustomExecutors([...customExecutors, ''])
    }

    // Функция удаления поля ручного ввода
    const removeCustomExecutorField = (index) => {
        const newCustomExecutors = customExecutors.filter((_, i) => i !== index)
        setCustomExecutors(newCustomExecutors)
    }

    // Функция обновления значения ручного ввода
    const updateCustomExecutor = (index, value) => {
        const newCustomExecutors = [...customExecutors]
        newCustomExecutors[index] = value
        setCustomExecutors(newCustomExecutors)
    }

    // Фильтрация запчастей по поиску
    const filteredParts = parts.filter(part => 
        part.name.toLowerCase().includes(searchParts.toLowerCase())
    )

    //functions
    const sendTelegramNotification = async (operation) => {
        const usedPartsInfo = operation.usedParts.map(part => 
            `• ${part.count} ${part.description} - ${part.name}`
        ).join('\n')

        const executorsInfo = [
            ...selectedExecutors,
            ...customExecutors.filter(exec => exec.trim() !== '')
        ].join(', ')

        const message = `🔧 <b>Новая операция добавлена</b>

📅 Дата: ${new Date(operation.beginDate).toLocaleDateString('ru-RU')}
🔄 Период: ${operation.period} год(а)
👨‍🔧 Исполнители: ${executorsInfo}
👤 Добавил: ${session?.user?.name || 'Неизвестный пользователь'}

📝 Описание:
${operation.description}

${operation.usedParts.length > 0 ? `\n📦 Использованные запчасти:\n${usedPartsInfo}` : ''}`

        try {
            await axios.post('/api/telegram/sendNotification', {
                message,
                chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                message_thread_id: 47,
                parse_mode: 'HTML'
            })
        } catch (error) {
            console.error('Error sending Telegram notification:', error)
        }
    }

    async function setInspection(objectID, period, beginDate, date, type, description, executors, usedParts) {
        try {
            // Подготавливаем данные о запчастях
            const formattedUsedParts = usedParts.map(part => ({
                _id: part._id,
                name: part.name,
                catagory: part.catagory,
                serialNumber: part.serialNumber || '',
                manufacturer: part.manufacturer || '',
                count: Number(part.count),
                unit: part.unit,
                sum: part.sum || 0
            }))

            // Получаем информацию об объекте
            const techResponse = await axios.post('/api/teches/object', { _id: objectID })
            const techObject = techResponse.data
            const objectName = `${techObject.catagory} ${techObject.name}`

            // Создаем операцию
            const operationResponse = await axios.post('/api/operations/add', {
                objectID,
                period,
                beginDate,
                date,
                type,
                description,
                executors,
                usedParts: formattedUsedParts,
                createdBy: session?.user?.login || 'unknown'
            })

            // Если есть запчасти, списываем их
            if (formattedUsedParts.length > 0) {
                await axios.post('/api/parts/writeOff', {
                    parts: formattedUsedParts,
                    objectID,
                    date,
                    workerName: executors[0] || 'unknown',
                    description
                })
            }

            // Отправляем уведомление в Telegram
            const message = `🔍 <b>Новый технический осмотр</b>

📅 Дата: ${new Date(beginDate).toLocaleDateString('ru-RU')}
🚜 Объект: ${objectName}
🔄 Период: ${period} год(а)
👨‍🔧 Исполнители: ${executors.join(', ')}
✍️ Описание: ${description || '-'}
👤 Создал: ${session?.user?.name || 'Система'}

${formattedUsedParts.length > 0 ? `\n📦 Использованные запчасти:\n${formattedUsedParts.map(part => 
    `• ${part.count} ${part.unit} - ${part.name}${part.manufacturer ? ` (${part.manufacturer})` : ''}`
).join('\n')}` : ''}`

            await axios.post('/api/telegram/sendNotification', {
                message,
                chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                message_thread_id: 47,
                parse_mode: 'HTML'
            })

            return operationResponse
        } catch (error) {
            console.error('Error adding inspection:', error)
            throw error
        }
    }
    

    return(
        <div className="add">
            <p>Дата тех. осмотра</p>
            <input 
                type='date' 
                value={beginDateOperation || ''} 
                onChange={e=>setBeginDate(e.target.value)} 
                placeholder='Дата предыдущего осмотра'
            />
            <p>Период в годах</p>
            <input 
                type='number' 
                value={periodOperation || ''} 
                onChange={e=>setPeriod(e.target.value)} 
                placeholder='Период'
            />
            
            {/* Выбор исполнителей из списка */}
            <div className="executors-section">
                <p>Выберите исполнителей из списка</p>
                {workers.map(worker => (
                    <label key={worker._id} className="executor-item">
                        <input
                            type="checkbox"
                            checked={selectedExecutors.includes(worker.name)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedExecutors([...selectedExecutors, worker.name])
                                } else {
                                    setSelectedExecutors(selectedExecutors.filter(name => name !== worker.name))
                                }
                            }}
                        />
                        <span>{worker.name}</span>
                    </label>
                ))}
            </div>

            {/* Ручной ввод исполнителей */}
            <div className="custom-executors">
                <p>Добавьте дополнительных исполнителей</p>
                {customExecutors.map((executor, index) => (
                    <div key={index} className="custom-executor-input">
                        <input
                            type="text"
                            value={executor || ''}
                            onChange={(e) => updateCustomExecutor(index, e.target.value)}
                            placeholder="ФИО исполнителя"
                        />
                        <button 
                            type="button" 
                            onClick={() => removeCustomExecutorField(index)}
                            className="remove-executor"
                        >
                            Удалить
                        </button>
                    </div>
                ))}
                <button 
                    type="button" 
                    onClick={addCustomExecutorField}
                    className="add-executor"
                >
                    Добавить исполнителя
                </button>
            </div>

            <textarea 
                value={descriptionOpertaion || ''} 
                onChange={e=>setDescriptionOperation(e.target.value)} 
                placeholder='Введите описание выполненной операции'
            />

            {/* Выбор запчастей */}
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
                                value={searchParts || ''}
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
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedParts([...selectedParts, part._id])
                                                } else {
                                                    setSelectedParts(selectedParts.filter(id => id !== part._id))
                                                    const newPartValues = {...partValues}
                                                    delete newPartValues[part._id]
                                                    setPartValues(newPartValues)
                                                }
                                            }}
                                        />
                                        <span>{part.name} (В наличии: {part.count})</span>
                                    </div>
                                    
                                    {selectedParts.includes(part._id) && (
                                        <div className="part-details">
                                            <input 
                                                type="number"
                                                min="1"
                                                max={part.count}
                                                value={partValues[part._id] || ''}
                                                onChange={(e) => {
                                                    setPartValues({
                                                        ...partValues,
                                                        [part._id]: e.target.value
                                                    })
                                                }}
                                                placeholder="Количество"
                                            />
                                            <select
                                                value={selectedUnits[part._id] || ''}
                                                onChange={(e) => {
                                                    setSelectedUnits({
                                                        ...selectedUnits,
                                                        [part._id]: e.target.value
                                                    })
                                                }}
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
            </div>

            {err && <div className="error-message">{err}</div>}

            <button onClick={async ()=>{
                // Собираем всех исполнителей
                const customExecutorsList = customExecutors
                    .map(exec => exec.trim())
                    .filter(exec => exec !== '')

                const allExecutors = [...selectedExecutors, ...customExecutorsList]

                // Проверка наличия хотя бы одного исполнителя
                if (allExecutors.length === 0) {
                    setErr('Добавьте хотя бы одного исполнителя')
                    return
                }

                // Подготавливаем запчасти
                const usedParts = selectedParts.map(partId => {
                    const part = parts.find(p => p._id === partId)
                    return {
                        _id: partId,
                        name: part.name,
                        catagory: part.catagory,
                        count: Number(partValues[partId] || 0),
                        unit: selectedUnits[partId] || ''
                    }
                }).filter(part => part.count > 0)

                setInspection(
                    objectID, 
                    periodOperation, 
                    beginDateOperation, 
                    beginDateOperation, 
                    type, 
                    descriptionOpertaion,
                    allExecutors,
                    usedParts
                )
                .then(res=>{
                    setOperations(prev => [...prev, res.data])
                    router.push(`/objects/${objectID}`)
                    setTypeOperation(listTypesOperations[0])
                })
                .catch(e=>console.log(e))
            }}>Добавить</button>
        </div>
    )
}