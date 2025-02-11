import Image from 'next/image'
import axios from 'axios'
import { useState, useEffect } from 'react';
import '../scss/completeReq.scss'

export default function CompleteReq({
    requests, 
    setErr, 
    dateBegin, 
    _id, 
    arrActive, 
    setArrActive, 
    workers,
    objects
}){
    //default
    let arr = []
    let defaultDate = new Date().toLocaleDateString()
    const [parts, setParts] = useState({}) // Состояние для запчастей
    const [visible, setVisible] = useState(false)
    const [workersForObjects, setWorkersForObjects] = useState({})

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
    let createDataEnd = formatDate(defaultDate)

    // Получение данных запчастей
    async function getPartsData(partsIds) {
        try {
            const response = await axios.post('/api/parts/optionParts', { partsArr: partsIds })
            const partsMap = response.data.reduce((acc, part) => {
                acc[part._id] = part;
                return acc;
            }, {});
            return partsMap;
        } catch (error) {
            console.error('Error fetching parts data:', error)
            return {}
        }
    }

    // Загружаем данные о запчастях при монтировании компонента
    useEffect(() => {
        const loadPartsData = async () => {
            const partsIds = [...new Set(requests.flatMap(req => 
                req.parts.map(part => part._id)
            ))];
            const partsData = await getPartsData(partsIds);
            setParts(partsData);
        };
        
        loadPartsData();
    }, [requests]);

    useEffect(() => {
        // Инициализируем работников для каждого объекта первым работником из списка
        if (workers.length > 0) {
            const initialWorkers = requests.reduce((acc, request) => {
                acc[request._id] = workers[0].name;
                return acc;
            }, {});
            setWorkersForObjects(initialWorkers);
        }
    }, [workers, requests]);

    //functions
    async function completeReq(_id, dateBegin, requests, dateNow, workersMap) {
        try {
            // Сначала получаем оригинальную заявку для информации о создателе
            const originalReq = await axios.get(`/api/requisition/${_id}`);
            const createdBy = originalReq.data.createdBy;

            // Затем отправляем запрос на завершение
            const response = await axios.post('/api/requisition/completeReq', {
                _id: _id, 
                dateBegin: dateBegin, 
                requests: requests.map(req => ({
                    ...req,
                    workerName: workersMap[req._id]
                })), 
                dateNow: dateNow
            });

            // Отправляем уведомление с информацией о создателе
            await sendCompletionNotification(dateBegin, requests, workersMap, parts, createdBy);

            return response;
        } catch (error) {
            console.error('Error in completeReq:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw new Error('Ошибка при завершении заявки');
        }
    }
    
    async function sendCompletionNotification(dateBegin, requests, workersForObjects, partsData, createdBy) {
        const message = `<b>✅ Заявка выполнена и перемещена в архив</b>

📅 Дата создания: ${dateBegin}
📅 Дата завершения: ${new Date().toLocaleDateString()}
👤 Создал: ${createdBy?.username || 'Неизвестно'} (${createdBy?.role || 'Неизвестно'})

${requests.map(request => `
🏢 Объект: ${objects[request.obj]?.name || 'Бухгалтерия'}
👨‍🔧 Исполнитель: ${workersForObjects[request._id]}
<b>Запчасти:</b>
${request.parts.map(part => {
    const partInfo = partsData[part._id] || {};
    return `• ${part.countReq} ${part.description} ${partInfo.name || 'Загрузка...'}`
}).join('\n')}`).join('\n\n')}`;

        try {
            await axios.post('/api/telegram/sendNotification', { message, type: 'requests' });
        } catch (error) {
            console.error('Failed to send completion notification:', error);
        }
    }

    function validation() {
        let hasError = false;
        let totalNeeded = {};
        arr = []; // Очищаем массив ошибок

        // Сначала получим актуальные данные о запчастях
        const checkParts = async () => {
            try {
                const uniquePartIds = [...new Set(requests.flatMap(req => 
                    req.parts.map(part => part._id)
                ))];
                
                const response = await axios.post('/api/parts/optionParts', {
                    partsArr: uniquePartIds
                });
                
                const partsData = response.data.reduce((acc, part) => {
                    acc[part._id] = part;
                    return acc;
                }, {});

                // Подсчитываем общее необходимое количество
                requests.forEach(request => {
                    request.parts.forEach(part => {
                        if (!totalNeeded[part._id]) {
                            totalNeeded[part._id] = {
                                count: partsData[part._id]?.count || 0,
                                needed: 0,
                                name: partsData[part._id]?.name || 'Неизвестная запчасть'
                            }
                        }
                        totalNeeded[part._id].needed += part.countReq;
                    });
                });

                // Проверяем достаточно ли запчастей
                Object.entries(totalNeeded).forEach(([partId, data]) => {
                    if (data.count < data.needed) {
                        arr.push(`Недостаточно запчастей "${data.name}": имеется ${data.count}, требуется ${data.needed}`);
                        hasError = true;
                    }
                });

                if (hasError) {
                    setErr(arr);
                } else {
                    setErr([]);
                    setVisible(true);
                }
            } catch (error) {
                console.error('Ошибка при проверке запчастей:', error);
                setErr(['Ошибка при проверке наличия запчастей']);
            }
        };

        checkParts();
    }

    return !visible ? (
        <button onClick={validation}>
            Завершить 
            <Image src={'/components/complete.svg'} 
                width={20} 
                height={20} 
                alt="completeReq"/>
        </button>
    ) : (
        <div className='addWorker'>
            <div className='message'>
                <h3>Укажите работников для каждого объекта</h3>
                {requests.map((request, index) => (
                    <div key={request._id} className="worker-selection">
                        <p>{`Объект ${index+1}: `+objects[request.obj]?.name}</p>
                        <select 
                            value={workersForObjects[request._id] || ''} 
                            onChange={e => setWorkersForObjects(prev => ({
                                ...prev,
                                [request._id]: e.target.value
                            }))}
                        >
                            <option value="">Выберите работника</option>
                            {workers.map((worker, idx) => (
                                <option key={idx} value={worker.name}>
                                    {worker.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                
                <div className='btns'>
                    <button onClick={() => {
                        const allWorkersSelected = requests.every(request => 
                            workersForObjects[request._id]
                        );

                        if (!allWorkersSelected) {
                            setErr(['Пожалуйста, выберите работников для всех объектов']);
                            return;
                        }

                        completeReq(_id, dateBegin, requests, createDataEnd, workersForObjects)
                            .then(res => {
                                setArrActive(arrActive.filter(item => item._id !== res.data))
                                setVisible(false)
                            })
                            .catch(e => {
                                console.error(e)
                                setErr(['Ошибка при завершении заявки'])
                            })
                    }}>Завершить</button>
                    <button onClick={() => setVisible(false)}>Назад</button>
                </div>
            </div>
        </div>
    )
}