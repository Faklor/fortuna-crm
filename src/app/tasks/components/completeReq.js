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
    const [isLoading, setIsLoading] = useState(false);

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
    async function sendCompletionNotification(dateBegin, requests) {
        const message = `<b>❌ Заявка выполнена, запчасти занесены на склад</b>

📅 Дата создания: ${dateBegin}
📅 Дата завершения: ${new Date().toLocaleDateString()}

${requests.map(request => `
🏢 Объект: ${request.obj.name}

📦 Запчасти:
${request.parts.map(part => `• ${part.countReq} шт. - ${part.name}`).join('\n')}`).join('\n\n')}`;

        try {
            await axios.post('/api/telegram/sendNotification', { 
                message,
                type: 'requests' 
            });
        } catch (error) {
            console.error('Failed to send telegram notification:', error);
        }
    }

    async function completeReq(_id, dateBegin, requests) {
        try {
            setIsLoading(true);
            const response = await axios.post('/api/requisition/completeReq', {
                _id,
                dateBegin,
                requests,
                dateEnd: new Date().toISOString()
            });
            
            // Отправляем уведомление в Telegram
            await sendCompletionNotification(dateBegin, requests);
            
            // Обновляем UI после успешного завершения
            setArrActive(arrActive.filter(item => item._id !== response.data));
            return response;
        } catch (error) {
            console.error('Error in completeReq:', error);
            throw new Error(error.response?.data?.error || 'Ошибка при завершении заявки');
        } finally {
            setIsLoading(false);
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

    return (
        <button 
            onClick={() => {
                completeReq(_id, dateBegin, requests)
                    .catch(error => setErr([error.message]));
            }}
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
        >
            {isLoading ? 'Завершение...' : 'Завершить'}
            <Image 
                src={'/components/complete.svg'} 
                width={20} 
                height={20} 
                alt="completeReq"
            />
        </button>
    );
}