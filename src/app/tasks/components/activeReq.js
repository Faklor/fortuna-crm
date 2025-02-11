import { useState, useEffect } from "react"
import '../scss/activeReq.scss'
import axios from "axios"
import Image from "next/image"
import { useRouter } from "next/navigation";
//------------component--------------
import CompleteReq from "./completeReq"
 

export default function ActiveReq({_id, index, dateBegin, urgency, requests, setArrActive, arrActive, workers, createdBy}){
    const router = useRouter()
    const [objects, setObjects] = useState({})
    const [partsOptions, setPartsOptions] = useState({})
    const [err, setErr] = useState(null)

    async function getObj(_id){
        return await axios.post('/api/teches/object',{_id:_id})
    }
    
    async function getParts(partsArr){
        return await axios.post('/api/parts/optionParts', {partsArr:partsArr})
    }

    async function deleteReq(_id){
        return await axios.post('/api/requisition/deleteReq',{_id:_id})
    }

    async function sendCancelNotification(reqData, objects, partsOptions) {
        let urgencyEmoji;
        switch(reqData.urgency) {
            case 'СРОЧНАЯ':
                urgencyEmoji = '🔴';
                break;
            case 'СРЕДНЕЙ СРОЧНОСТИ':
                urgencyEmoji = '🟡';
                break;
            case 'НЕ СРОЧНАЯ':
                urgencyEmoji = '🟢';
                break;
            default:
                urgencyEmoji = '⚪';
        }

        const objectsInfo = Object.values(objects).map(obj => {
            const parts = partsOptions[obj._id] || [];
            return `
🏢 Объект: ${obj.name}
${parts.map(part => `• ${part.countReq} ${part.description} ${part._doc.name}`).join('\n')}`;
        }).join('\n\n');

        const message = `
<b>❌ Заявка отменена</b>

📅 Дата создания: ${reqData.dateBegin}
⚡ Срочность: ${urgencyEmoji} <code>${reqData.urgency}</code>

${objectsInfo}
`;

        return await axios.post('/api/telegram/sendNotification', { message, type: 'requests' });
    }

    function getColor(){
        if(urgency === 'НЕ СРОЧНАЯ'){
            return '#A9FF8F'
        }
        else if(urgency === 'СРЕДНЕЙ СРОЧНОСТИ'){
            return '#FFE48D'
        }
        else if((urgency === 'СРОЧНАЯ')){
            return '#FF8181'
        }
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                // Загружаем информацию об объектах
                const uniqueObjIds = [...new Set(requests.map(req => req.obj))]
                const objectsData = {}
                
                for (const objId of uniqueObjIds) {
                    const response = await getObj(objId)
                    if (response.data) {
                        objectsData[objId] = response.data
                    }
                }
                setObjects(objectsData)

                // Загружаем информацию о запчастях
                const partsData = {}
                for (const request of requests) {
                    if (!request.parts || !Array.isArray(request.parts)) continue

                    const partsIds = request.parts.map(p => p._id)
                    const partsResponse = await getParts(partsIds)

                    if (!partsResponse.data) continue

                    const partsWithQuantity = partsResponse.data.map(part => {
                        const requestPart = request.parts.find(p => p._id === part._id)
                        return {
                            ...part,
                            countReq: requestPart?.countReq || 0,
                            description: requestPart?.description || 'шт.'
                        }
                    })

                    partsData[request._id] = partsWithQuantity
                }
                setPartsOptions(partsData)
            } catch (error) {
                console.error('Error loading data:', error)
                setErr('Ошибка при загрузке данных')
            }
        }

        loadData()
    }, [requests])

    return (
        <div className="reqActive">
            <div style={{background:getColor()}} className="lineStatus"/>
            <div className="titleReq">
                <h2 style={{color:getColor()}}>Заявка №{index+1}</h2>
                <p>Дата начала: {dateBegin}</p>
                <p>Срочность: {urgency}</p>
                <p>Количество объектов: {requests.length}</p>
                <p>Создал: {createdBy?.username} ({createdBy?.role})</p>
            </div>
            
            <div className="contollers">
                <CompleteReq 
                    requests={requests}
                    setErr={setErr}
                    dateBegin={dateBegin}
                    _id={_id}
                    arrActive={arrActive}
                    setArrActive={setArrActive}
                    workers={workers}
                    objects={objects}
                />
                <button>
                    Редактировать
                    <Image src={'/components/edit.svg'} width={20} height={20} alt="editReq"/>
                </button>
                <button onClick={async () => {
                    try {
                        await deleteReq(_id)
                        await sendCancelNotification(
                            { dateBegin, urgency },
                            objects,
                            partsOptions
                        )
                        setArrActive(arrActive.filter(item => item._id !== _id))
                    } catch (e) {
                        console.error(e)
                        setErr('Ошибка при удалении заявки')
                    }
                }}>
                    Отменить
                    <Image src={'/components/close.svg'} width={20} height={20} alt="cancelReq"/>
                </button>
            </div>

            <div className="objects-container">
                {requests.map((request, index) => {
                    const object = objects[request.obj]
                    if (!object) return null

                    return (
                        <div key={request._id} className="object-section">
                            <h3 onClick={() => router.push(`/warehouse?id=${object._id}`)}>
                                Объект {index + 1}: {object.name}
                            </h3>
                            <div className="parts-list">
                                {request.parts && request.parts.length > 0 ? (
                                    request.parts.map((requestPart, partIndex) => {
                                        const partData = partsOptions[request._id]?.[partIndex]
                                        if (!partData) return null

                                        return (
                                            <div key={partIndex} className="partReq">
                                                <div className="count">
                                                    <p>{partData.name} {partData.manufacturer}</p>
                                                    <p>Нужно: {partData.countReq} {partData.description}</p>
                                                    <p>Имеется: {partData.count}</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="no-parts-message">
                                        Для этого объекта не выбраны запчасти
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {err && <div className="error-message">{err}</div>}
        </div>
    )
}