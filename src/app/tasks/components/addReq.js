import { useState, useEffect } from 'react'
import '../scss/addReq.scss'
import axios from 'axios'

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

    //logic
    const handleCheckboxChange = (event, partId) => {
        const isChecked = event.target.checked;
        if (isChecked) {
          // Добавляем выбранную часть в состояние
          setSelectedParts((prevSelected) => [...prevSelected, partId]);
        } 
        else {
          // Удаляем часть из состояния
          setSelectedParts((prevSelected) =>
            prevSelected.filter((id) => id !== partId)
          )
        }
    }
    const handleNumberInputChange = (event, partId) => {
        const value = event.target.value;
        setPartValues((prevValues) => ({ ...prevValues, [partId]: value }));
    }
    const handleSelectChange = (e, partId) => {
        const value = e.target.value;
        setSelectedDes((prevSelectedDes) => ({ ...prevSelectedDes, [partId]: value }));
    }

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
    async function createReq(selectedArr,urgencySt,date,objectID){
        return await axios.post('/api/requisition/addActive',{selectedArr:selectedArr,urgencySt:urgencySt,date:date,objectID:objectID})
    }
    
    async function sendTelegramNotification(reqData, object, selectedParts) {
        // Определяем эмодзи и цвет в зависимости от срочности
        let urgencyEmoji, urgencyColor;
        switch(reqData.urgencySt) {
            case 'СРОЧНАЯ':
                urgencyEmoji = '🔴';
                urgencyColor = '#FF0000';
                break;
            case 'СРЕДНЕЙ СРОЧНОСТИ':
                urgencyEmoji = '🟡';
                urgencyColor = '#FFA500';
                break;
            case 'НЕ СРОЧНАЯ':
                urgencyEmoji = '🟢';
                urgencyColor = '#008000';
                break;
            default:
                urgencyEmoji = '⚪';
                urgencyColor = '#000000';
        }

        const partsWithNames = selectedParts.map(selectedPart => {
            const partInfo = parts.find(p => p._id === selectedPart._id);
            return {
                ...selectedPart,
                name: partInfo ? partInfo.name : 'Неизвестная запчасть'
            };
        });

        const message = `
        <b>🔔 Новая заявка создана</b>

📅 Дата: ${reqData.date}
🏢 Объект: ${object.name}
⚡ Срочность: ${urgencyEmoji} <code>${reqData.urgencySt}</code>

<b>Запчасти:</b>
${partsWithNames.map(part => `• ${part.countReq} ${part.description} ${part.name}`).join('\n')}
        `;

        return await axios.post('/api/telegram/sendNotification', { message, type: 'requests' });
    }

    
    return  <div className="addReq">
        <div className='message'>
            <div className="header">
                <button className="back-button" onClick={()=>setVisibleAdd(false)}>
                    ← Назад
                </button>
                <h2>Создание новой заявки</h2>
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
                    <select 
                        onChange={e=>setObjectSt(e.target.value)}
                        className="object-select"
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
                                            onChange={(e) => handleCheckboxChange(e, item._id)}
                                            className="part-checkbox"
                                        />
                                        <div className="part-info">
                                            <p className="part-name">{item.name}</p>
                                            <p className="part-stock">На складе: {item.count} шт.</p>
                                        </div>
                                    </div>
                                    
                                    {selectedParts.includes(item._id) && (
                                        <div className="part-details">
                                            <input 
                                                type="number" 
                                                placeholder='Количество'
                                                value={partValues[item._id] || ''} 
                                                onChange={(e) => handleNumberInputChange(e, item._id)}
                                                className="quantity-input"
                                            />
                                            <select 
                                                onChange={e=>handleSelectChange(e, item._id)} 
                                                value={selectedDes[item._id] || ''}
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
                                        <input type='checkbox' value={item._id} onChange={(e) => handleCheckboxChange(e, item._id)}/>
                                        <div className="part-info">
                                            <p className="part-name">{item.name}</p>
                                            <p className="part-stock">На складе: {item.count} шт.</p>
                                        </div>
                                    </div>
                                    {selectedParts.includes(item._id) && <div className="part-details">
                                        <input type="number" placeholder='Введите нужное кол-во' 
                                        value={partValues[item._id] || ''} onChange={(e) => handleNumberInputChange(e, item._id)}/>
                                        <select onChange={e=>handleSelectChange(e, item._id)} value={selectedDes[item._id] || ''}>
                                            <option></option>
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

            {err && <div className="error-message">⚠️ {err}</div>}

            <button 
                className="submit-button"
                onClick={()=>{
                    let selectedArr = []
                    selectedParts.forEach((partId) => {
                        selectedArr.push({
                            _id:partId, 
                            countReq:Number(partValues[partId] !== undefined?partValues[partId]:''), 
                            description:selectedDes[partId] !== undefined?selectedDes[partId]:''
                        })
                    })

                    if(selectedArr.length === 0){
                        setErr('Не выбраны запчасти')
                    }
                    else{
                        selectedArr.forEach((item)=>{
                            if(item.count <= 0){
                                setErr('Не везде указано кол-во')        
                            }
                        })

                        setErr('')
                        createReq(selectedArr,urgencySt,date,JSON.parse(objectSt)._id)
                        .then(res=>{
                            arrActive.push(res.data)
                            // Отправляем уведомление в Telegram
                            sendTelegramNotification(
                                { date, urgencySt, objectSt }, 
                                JSON.parse(objectSt), 
                                selectedArr
                            ).catch(e => console.log('Failed to send notification:', e))
                            
                            setVisibleAdd(false)
                            // Добавляем обновление страницы
                            window.location.reload()
                        })
                        .catch(e=>console.log(e))
                    }                
                }}
            >
                ✅ Создать заявку
            </button>
        </div>
    </div>
}