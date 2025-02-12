import { useState, useEffect } from 'react'
import '../scss/addReq.scss'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const URGENCY_TYPES = {
    'НЕ СРОЧНАЯ': {
        emoji: '🟢',
        color: '#4CAF50'
    },
    'СРЕДНЕЙ СРОЧНОСТИ': {
        emoji: '🟡',
        color: '#FFA500'
    },
    'СРОЧНАЯ': {
        emoji: '🔴',
        color: '#F44336'
    }
};

export default function AddReq({setVisibleAdd, arrActive, objects, parts}){
    const { data: session } = useSession()
    const router = useRouter()

    // Группируем объекты по категориям
    const categorizedObjects = objects.reduce((acc, obj) => {
        const category = obj.catagory || 'Без категории';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(obj);
        return acc;
    }, {});

    // Сортируем объекты в каждой категории по имени
    Object.keys(categorizedObjects).forEach(category => {
        categorizedObjects[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Получаем первый объект из отсортированного списка
    const firstCategory = Object.keys(categorizedObjects)[0];
    const firstObject = categorizedObjects[firstCategory][0];

    //default
    const selectedData = {}
    
    const arrUrgency = ['НЕ СРОЧНАЯ', 'СРЕДНЕЙ СРОЧНОСТИ', 'СРОЧНАЯ']
    const des = ['шт.', 'л.', 'см.', 'м.']
    let bindingParts = []
    let otherParts = [...parts]
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
    const [date, setSdate] = useState(formatDate(defaultDate))
    const [urgencySt, setUrgencySt] = useState(arrUrgency[0])
    const [objectSt, setObjectSt] = useState(JSON.stringify(firstObject))
    const [selectDes, setSelectDes] = useState(des[0])
    //react-checked
    const [selectedParts, setSelectedParts] = useState([])
    const [partValues, setPartValues] = useState({})
    const [selectedDes, setSelectedDes] = useState({})
    const [err, setErr] = useState('')

    // Добавляем состояния для поиска
    const [searchBindingParts, setSearchBindingParts] = useState('')
    const [searchOtherParts, setSearchOtherParts] = useState('')

    // Добавляем состояние для хранения множества объектов и их запчастей
    const [selectedObjects, setSelectedObjects] = useState([{
        obj: JSON.parse(objectSt),
        selectedParts: [],
        partValues: {},
        selectedDes: {}
    }]);

    // Функция добавления нового объекта
    const addNewObject = () => {
        setSelectedObjects([...selectedObjects, {
            obj: JSON.parse(objectSt),
            selectedParts: [],
            partValues: {},
            selectedDes: {}
        }]);
    };

    // Функция удаления объекта
    const removeObject = (index) => {
        setSelectedObjects(selectedObjects.filter((_, i) => i !== index));
    };

    //logic
    const handleCheckboxChange = (objectIndex, event, partId) => {
        const isChecked = event.target.checked;
        setSelectedObjects(prevObjects => {
            const newObjects = [...prevObjects];
            if (isChecked) {
                // Проверяем, не выбрана ли уже эта запчасть
                if (!newObjects[objectIndex].selectedParts.includes(partId)) {
                    newObjects[objectIndex].selectedParts = [...newObjects[objectIndex].selectedParts, partId];
                }
            } else {
                newObjects[objectIndex].selectedParts = newObjects[objectIndex].selectedParts.filter(id => id !== partId);
            }
            return newObjects;
        });
    };

    const handleNumberInputChange = (objectIndex, event, partId) => {
        const value = event.target.value;
        setSelectedObjects(prevObjects => {
            const newObjects = [...prevObjects];
            newObjects[objectIndex].partValues = {
                ...newObjects[objectIndex].partValues,
                [partId]: value
            };
            return newObjects;
        });
    };

    const handleSelectChange = (objectIndex, event, partId) => {
        const value = event.target.value;
        setSelectedObjects(prevObjects => {
            const newObjects = [...prevObjects];
            newObjects[objectIndex].selectedDes = {
                ...newObjects[objectIndex].selectedDes,
                [partId]: value
            };
            return newObjects;
        });
    };

    if(parts.length !== 0){
        parts.forEach((part,index)=>{
            JSON.parse(objectSt).bindingParts.forEach(partInObj=>{
                if(partInObj._id === part._id){
                    bindingParts.push(part)
                    
                    otherParts.splice(index, 1)
                }
            })

        })
    }

    // Фильтруем запчасти на основе поискового запроса
    const filteredBindingParts = [...new Set(bindingParts)].filter(part => 
        part.name.toLowerCase().includes(searchBindingParts.toLowerCase())
    )

    const filteredOtherParts = [...new Set(otherParts)].filter(part => 
        part.name.toLowerCase().includes(searchOtherParts.toLowerCase())
    )

    //functions
    async function createReq(requests, urgencySt, date) {
        return await axios.post('/api/requisition/addActive', {
            requests,
            urgencySt,
            date
        });
    }
    
    async function sendTelegramNotification(reqData, selectedObjects, parts, session) {
        const urgencyTypes = {
            'НЕ СРОЧНАЯ': '🟢',
            'СРЕДНЕЙ СРОЧНОСТИ': '🟡',
            'СРОЧНАЯ': '🔴'
        };

        const objectsInfo = selectedObjects.map(objData => {
            const partsInfo = objData.selectedParts.map(partId => {
                const part = parts.find(p => p._id === partId);
                return `• ${objData.partValues[partId]} ${objData.selectedDes[partId]} ${part.name}`;
            }).join('\n');

            return `
🏢 Объект: ${objData.obj.name}
${partsInfo}`;
        }).join('\n\n');

        const message = `
<b>🔔 Новая заявка создана</b>

📅 Дата: ${reqData.date}
⚡ Срочность: ${urgencyTypes[reqData.urgencySt]} <code>${reqData.urgencySt}</code>
👤 Создал: ${session.user.name} (${session.user.role})

${objectsInfo}`;

        return await axios.post('/api/telegram/sendNotification', { message, type: 'requests' });
    }

    // Обновляем функцию handleSubmit
    const handleSubmit = async () => {
        try {
            if (!session) {
                setErr('Необходимо авторизоваться');
                return;
            }

            // Проверяем наличие выбранных запчастей
            if (selectedObjects.some(obj => obj.selectedParts.length === 0)) {
                setErr('Выберите запчасти для всех объектов');
                return;
            }

            // Удаляем дубликаты запчастей для каждого объекта
            const uniqueRequests = selectedObjects.map(objData => ({
                obj: objData.obj._id,
                parts: Array.from(new Set(objData.selectedParts)).map(partId => ({
                    _id: partId,
                    countReq: parseInt(objData.partValues[partId] || 0),
                    description: objData.selectedDes[partId] || 'шт.'
                }))
            }));

            // Отправляем запрос на создание заявки
            const res = await createReq(uniqueRequests, urgencySt, date);
            
            // Если заявка успешно создана, отправляем уведомление
            if (res.data) {
                await sendTelegramNotification(
                    { date, urgencySt },
                    selectedObjects,
                    parts,
                    session
                );
                
                // Закрываем окно добавления
                setVisibleAdd(false);
                
                // Перезагружаем страницу вместо обновления состояния
                window.location.reload();
            }
        } catch (e) {
            console.error('Error creating requisition:', e);
            setErr(e.response?.data?.error || 'Ошибка при создании заявки');
        }
    };

    return  <div className="addReq">
        <div className='message'>
            <div className="header">
                <button className="back-button" onClick={()=>setVisibleAdd(false)}>
                    ← Назад
                </button>
                <h2>Создание новой заявки</h2>
            </div>

            <div className="objects-container">
                {selectedObjects.map((objData, objectIndex) => (
                    <div key={objectIndex} className="object-section">
                        <div className="object-header">
                            <h3>Объект {objectIndex + 1}</h3>
                            {objectIndex > 0 && (
                                <button 
                                    className="remove-object"
                                    onClick={() => removeObject(objectIndex)}
                                >
                                    Удалить объект
                                </button>
                            )}
                        </div>
                        
                        <div className="form-section">
                            <div className="form-group">
                                <label>📅 Дата заявки</label>
                                <input 
                                    type='date' 
                                    value={date} 
                                    onChange={e=>setSdate(e.target.value)}
                                    className="date-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>⚡ Срочность</label>
                                <select 
                                    onChange={e=>setUrgencySt(e.target.value)}
                                    className="urgency-select"
                                    style={{
                                        backgroundColor: URGENCY_TYPES[urgencySt].color,
                                        color: 'white'
                                    }}
                                >
                                    {arrUrgency.map((urgency, index)=>(
                                        <option 
                                            key={index} 
                                            value={urgency}
                                            style={{
                                                backgroundColor: 'white',
                                                color: URGENCY_TYPES[urgency].color
                                            }}
                                        >
                                            {URGENCY_TYPES[urgency].emoji} {urgency}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>🚜 Выберите объект</label>
                                <div className="object-select-container">
                                    <select 
                                        onChange={e => {
                                            setObjectSt(e.target.value);
                                            setSelectedObjects(prevObjects => {
                                                const newObjects = [...prevObjects];
                                                newObjects[objectIndex] = {
                                                    ...newObjects[objectIndex],
                                                    obj: JSON.parse(e.target.value)
                                                };
                                                return newObjects;
                                            });
                                        }}
                                        className="object-select"
                                        value={JSON.stringify(objData.obj)}
                                    >
                                        {Object.entries(categorizedObjects).map(([category, categoryObjects]) => (
                                            <optgroup key={category} label={category}>
                                                {categoryObjects.map((obj, index) => (
                                                    <option 
                                                        key={`${category}-${index}`} 
                                                        value={JSON.stringify(obj)}
                                                    >
                                                        {obj.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <button 
                                        className="add-part-button"
                                        onClick={() => router.push('/warehouse/addPart')}
                                        title="Добавить новую запчасть"
                                    >
                                        <Image 
                                            src="/components/add.svg" 
                                            width={24} 
                                            height={24} 
                                            alt="Добавить запчасть" 
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="parts-section">
                            <div className="parts-group">
                                <div className="parts-header">
                                    <h3>📦 Запчасти, привязанные к объекту</h3>
                                    <div className="search-container">
                                        <input 
                                            type="text"
                                            placeholder="🔍 Поиск запчастей..."
                                            value={searchBindingParts}
                                            onChange={(e) => setSearchBindingParts(e.target.value)}
                                            className="search-input"
                                        />
                                        {searchBindingParts && (
                                            <button 
                                                className="clear-search"
                                                onClick={() => setSearchBindingParts('')}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className='parts-grid'>
                                    {filteredBindingParts.length > 0 ? (
                                        filteredBindingParts.map((item,index)=>(
                                            <div key={index} className='part-card'>
                                                <div className="part-header">
                                                    <input 
                                                        type='checkbox' 
                                                        value={item._id} 
                                                        onChange={(e) => handleCheckboxChange(objectIndex, e, item._id)}
                                                        checked={objData.selectedParts.includes(item._id)}
                                                        className="part-checkbox"
                                                    />
                                                    <div className="part-info">
                                                        <p className="part-name">{item.name}</p>
                                                        <p className="part-stock">На складе: {item.count} шт.</p>
                                                    </div>
                                                </div>
                                                
                                                {objData.selectedParts.includes(item._id) && (
                                                    <div className="part-details">
                                                        <input 
                                                            type="number" 
                                                            placeholder='Количество'
                                                            value={objData.partValues[item._id] || ''} 
                                                            onChange={(e) => handleNumberInputChange(objectIndex, e, item._id)}
                                                            className="quantity-input"
                                                        />
                                                        <select 
                                                            onChange={(e) => handleSelectChange(objectIndex, e, item._id)} 
                                                            value={objData.selectedDes[item._id] || ''}
                                                            className="unit-select"
                                                        >
                                                            <option value="">Ед. изм.</option>
                                                            {des.map((item, index)=>(
                                                                <option key={index} value={item}>{item}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">
                                            Запчасти не найдены
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="parts-group">
                                <div className="parts-header">
                                    <h3>🔧 Другие запчасти</h3>
                                    <div className="search-container">
                                        <input 
                                            type="text"
                                            placeholder="🔍 Поиск запчастей..."
                                            value={searchOtherParts}
                                            onChange={(e) => setSearchOtherParts(e.target.value)}
                                            className="search-input"
                                        />
                                        {searchOtherParts && (
                                            <button 
                                                className="clear-search"
                                                onClick={() => setSearchOtherParts('')}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className='parts-grid'>
                                    {filteredOtherParts.length > 0 ? (
                                        filteredOtherParts.map((item,index)=>{
                                            return <div key={index} className='part-card'>
                                                <div className="part-header">
                                                    <input 
                                                        type='checkbox' 
                                                        value={item._id} 
                                                        onChange={(e) => handleCheckboxChange(objectIndex, e, item._id)}
                                                        checked={objData.selectedParts.includes(item._id)}
                                                    />
                                                    <div className="part-info">
                                                        <p className="part-name">{item.name}</p>
                                                        <p className="part-stock">На складе: {item.count} шт.</p>
                                                    </div>
                                                </div>
                                                {objData.selectedParts.includes(item._id) && <div className="part-details">
                                                    <input 
                                                        type="number" 
                                                        placeholder='Количество'
                                                        value={objData.partValues[item._id] || ''} 
                                                        onChange={(e) => handleNumberInputChange(objectIndex, e, item._id)}
                                                    />
                                                    <select 
                                                        onChange={(e) => handleSelectChange(objectIndex, e, item._id)}
                                                        value={objData.selectedDes[item._id] || ''}
                                                    >
                                                        <option value="">Ед. изм.</option>
                                                        {des.map((item, index)=>{
                                                            return <option key={index} value={item}>{item}</option>
                                                        })}
                                                    </select>
                                                </div>}
                                            </div>
                                        })
                                    ) : (
                                        <div className="no-results">
                                            Запчасти не найдены
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button 
                    className="add-object-button"
                    onClick={addNewObject}
                >
                    + Добавить объект
                </button>
            </div>

            {err && <div className="error-message">{err}</div>}

            <button 
                className="submit-button"
                onClick={handleSubmit}
            >
                ✅ Создать заявку
            </button>
        </div>
    </div>
}