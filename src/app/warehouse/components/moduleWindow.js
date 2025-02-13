import '../scss/moduleWindow.scss'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import axios from 'axios'

export default function ModuleWindow({
    _id,
    name,
    catagory,
    contact,
    count,
    manufacturer,
    sellNumber,
    serialNumber,
    sum,
    index, 
    workers, 
    teches,
    sendVisible, 
    setSendVisible,

    setVisibleParts
}){
    const { data: session } = useSession()
    //console.log(teches[0]?teches[0].name:'')
    //default 
   
    const des = ['шт.', 'л.', 'см.', 'м.']
    //react
    const sortedWorkers = [...workers].sort((a, b) => {
        const orgCompare = (a.organization || '').localeCompare(b.organization || '', 'ru');
        if (orgCompare !== 0) return orgCompare;
        const posCompare = (a.position || '').localeCompare(b.position || '', 'ru');
        if (posCompare !== 0) return posCompare;
        return a.name.localeCompare(b.name, 'ru');
    });

    const sortedTeches = [...teches].sort((a, b) => {
        const catCompare = (a.catagory || '').localeCompare(b.catagory || '', 'ru');
        if (catCompare !== 0) return catCompare;
        return a.name.localeCompare(b.name, 'ru');
    });

    const [sendCount, setSendCount] = useState(count)
    const [sendWorker, setWorker] = useState('')
    const [sendObject, setObject] = useState('')
    const [sendDes, setSendDes] = useState(des[0])

    useEffect(()=>{
        if(workers[0]){
            // Используем первого работника из отсортированного массива
            const firstWorker = sortedWorkers[0];
            setWorker(firstWorker.name);
        }
        if(teches[0]){
            // Используем первый объект из отсортированного массива
            const firstTech = sortedTeches[0];
            setObject(firstTech._id);
        }

        setSendCount(count);
    }, [workers, teches, count]);

    //default
    let part = {
        _id:_id,
        name:name,
        catagory:catagory,
        manufacturer:manufacturer,
        sellNumber:sellNumber,
        serialNumber:serialNumber,
        contact:contact,
        sum:sum
    }
    

    //function
    async function SendPart(workerName, objectID, part, count, des){

       return await axios.post('/api/parts/sendPart', {date:new Date(), workerName:workerName, objectID:objectID, part:part, count:count, des:des})
    }

    // Группируем работников по организациям
    const groupedWorkers = workers.reduce((acc, worker) => {
        const organization = worker.organization || 'Без организации';
        if (!acc[organization]) {
            acc[organization] = [];
        }
        acc[organization].push(worker);
        return acc;
    }, {});

    // Группируем объекты по категориям
    const groupedTeches = teches.reduce((acc, tech) => {
        const category = tech.catagory || '📦 Другое';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(tech);
        return acc;
    }, {});

    // Сортируем категории объектов
    const sortedCategories = Object.keys(groupedTeches).sort((a, b) => {
        const order = {
            '🚜': 1,  // Трактора
            '🔆': 2,  // Комбайны
            '💧': 3,  // Опрыскиватели
            '📦': 4,  // Погрузчики
            '🏠': 5,  // Здания
            '🚗': 6   // Автомобили
        };
        return (order[a.charAt(0)] || 99) - (order[b.charAt(0)] || 99);
    });

    // Сортируем организации
    const sortedOrganizations = Object.keys(groupedWorkers).sort();

    const sendTelegramNotification = async (objectName, workerName, count, description, remainingCount) => {
        const message = `🔧 <b>Выдача запчасти</b>

🏢 Объект: ${objectName}
👨‍🔧 Работник: ${workerName}
📅 Дата: ${new Date().toLocaleString('ru-RU')}
👤 Выдал: ${session?.user?.name || 'Неизвестный пользователь'} 

📦 Выданная запчасть:
• ${count} ${description} - ${name} (Остаток: ${remainingCount} шт.)
${manufacturer ? `Производитель: ${manufacturer}` : ''}
${sellNumber ? `Товарный номер: ${sellNumber}` : ''}
${serialNumber ? `Серийный номер: ${serialNumber}` : ''}
${sum ? `Цена: ${sum}` : ''}`

        try {
            await axios.post('/api/telegram/sendNotification', {
                message,
                chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                message_thread_id: 30,
                parse_mode: 'HTML'
            })
        } catch (error) {
            console.error('Error sending Telegram notification:', error)
        }
    }

    return sendVisible?<div className="moduleWindow">
        <div className='message'>
            <div className='title'>
                <h2>Выдача запчасти</h2>
                <button onClick={()=>setSendVisible(false)}><Image src={'/components/close.svg'} width={40} height={40} alt='closeWindow'/></button>
            </div>
            
            <p>{name}</p>
            {manufacturer?<p>Производитель: {manufacturer}</p>:''}
            {sellNumber?<p>Товарный номер: {sellNumber}</p>:''}
            {serialNumber?<p>Серийный номер: {serialNumber}</p>:''}
            {sum?<p>Цена: {sum}</p>:''}
            <hr/>
            <br/>
            <p>Выберите работника</p>
            <select 
                className='workers' 
                onChange={(e)=>{setWorker(e.target.value)}}
                value={sendWorker || ""}
            >
                <option value="" disabled>Выберите работника</option>
                {sortedOrganizations.map(organization => (
                    <optgroup key={organization} label={organization}>
                        {groupedWorkers[organization]
                            .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                            .map(worker => (
                                <option key={worker._id} value={worker.name}>
                                    {`${worker.name} ${worker.position ? `(${worker.position})` : ''}`}
                                </option>
                            ))
                        }
                    </optgroup>
                ))}
            </select>
            <p>Выберите Объект</p>
            <select 
                className='objects' 
                onChange={(e)=>{setObject(e.target.value)}}
                value={sendObject || ""}
            >
                <option value="" disabled>Выберите объект</option>
                {sortedCategories.map(category => (
                    <optgroup key={category} label={category}>
                        {groupedTeches[category]
                            .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                            .map(tech => (
                                <option key={tech._id} value={tech._id}>
                                    {tech.name}
                                </option>
                            ))
                        }
                    </optgroup>
                ))}
            </select>
            <br/>
            <p>Выберите кол-во</p>
            <div className='controllersWindow'> 
                <div>
                    <input type='number' value={sendCount} onChange={e=>{
                        if(e.target.value > count){

                        }
                        else if(e.target.value <= 0){

                        }
                        else{
                            setSendCount(e.target.value)
                        }
                        }}/>
                    <select onChange={(e)=>setSendDes(e.target.value)}>
                        {des.map((item,index)=>{
                            return <option key={index} value={item}>{item}</option>
                        })}
                    </select>
                </div>
                
                <button onClick={async ()=>{
                    try {
                        const res = await SendPart(sendWorker, sendObject, part, Number(sendCount), sendDes)
                        
                        // Находим имя объекта
                        const selectedObject = teches.find(tech => tech._id === sendObject)
                        const objectName = selectedObject ? selectedObject.name : 'Неизвестный объект'
                        
                        // Обновляем состояние частей
                        setVisibleParts((prevParts) => {
                            const updatedParts = [...prevParts]
                            const index = updatedParts.findIndex((item) => item._id === _id)
                            if (index !== -1) {
                                updatedParts[index] = { 
                                    ...updatedParts[index], 
                                    count: JSON.parse(res.data).data.count 
                                }
                            }
                            return updatedParts
                        })

                        // Отправляем уведомление в Telegram
                        await sendTelegramNotification(
                            objectName,
                            sendWorker,
                            sendCount,
                            sendDes,
                            JSON.parse(res.data).data.count
                        )

                        // Закрываем окно после успешной выдачи
                        setSendVisible(false)
                    } catch (error) {
                        console.error('Error:', error)
                    }
                }}>Выдать</button>
            </div>
        </div>
    </div>:<></>
}