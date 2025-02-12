import Image from 'next/image'
import axios from 'axios'
import { useState, useEffect } from 'react';
import '../scss/completeReq.scss'
import { useSession } from "next-auth/react";

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
    const { data: session } = useSession();
    //default
    const [parts, setParts] = useState({}) // Состояние для запчастей
    const [workersForObjects, setWorkersForObjects] = useState({})
    const [isLoading, setIsLoading] = useState(false);

   

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
        try {
            const partsData = await Promise.all(requests.map(async request => {
                // Получаем данные о запчастях
                const parts = await Promise.all(request.parts.map(async part => {
                    const fullPart = await axios.post('/api/parts/optionParts', { 
                        partsArr: [part._id] 
                    });
                    return {
                        ...part,
                        name: fullPart.data[0]?.name
                    };
                }));

                // Получаем объект из пропсов objects по ID
                const objectName = objects[request.obj]?.name || 'Объект не указан';

                return {
                    ...request,
                    parts,
                    objectName
                };
            }));

            const message = `<b>❌ Заявка выполнена, запчасти занесенны на склад ❌</b>

👤 Выполнил: ${session?.user?.name || 'Неизвестный пользователь'}

📅 Дата создания: ${dateBegin}
📅 Дата завершения: ${new Date().toLocaleDateString()}

${partsData.map(request => `
🏢 Объект: ${request.objectName}

📦 Запчасти:
${request.parts.map(part => `• ${part.countReq} шт. - ${part.name}`).join('\n')}`).join('\n\n')}`;

            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM;

            const response = await axios.post('/api/telegram/sendNotification', { 
                message,
                chat_id: chatId,
                message_thread_id: 4
            });

            if (!response.data.success) {
                throw new Error('Failed to send notification');
            }
        } catch (error) {
            console.error('Failed to send telegram notification:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
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