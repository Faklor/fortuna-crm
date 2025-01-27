import { useEffect, useRef, useState } from 'react'
import '../scss/operation.scss'
import Image from 'next/image'
import axios from 'axios'

//-----------------Components------------------
import EditOperation from './editOperation'

export default function Operation({
    _id, 
    date, 
    type, 
    description,  
    refText, 
    index, 
    periodMotorCheck, 
    category,
    usedParts,
    createdBy,
    setOperations,
    executors,
    workers,
    parts
}){

    
    //refs
    const refsdescriptions = useRef([])
    //ref={(el)=>refsdescriptions.current[index] = el}

    //default 
    const categoryTech = category === '🔆' || category === '💧' || category === '🚜' || category === '📦'?'м.ч.':'км.'

    //react
    const [visibleEdit, setVisibleEdit] = useState(false)

    useEffect(()=>{
        if(refText.current.length !== 0){
            
            refText.current.forEach(el=>{
                if(el !== null){
                    el.style.height = '1px'
                    el.style.height = el.scrollHeight + 'px'
                }
                
            })
        }
        

    },[refsdescriptions])

    //function
    async function deleteOperation(_id){
        return await axios.post('/api/operations/delete', {_id:_id})
    }

    function getColor(){
        if(type === 'Ремонт'){
            return '#4F8DE3'
        }
        else if(type === 'Технический Осмотр'){
            return '#FA5C62'
        }
        else if(type === 'Навигация'){
            return '#84E168'
        }
        else if(type === 'Техническое обслуживание'){
            return '#FF58EE'
        }
        //return '#4F8DE3'
    }

    return !visibleEdit ? (
        <div className="operation">
            <div>
                <h3 style={{color:getColor()}}>{type}</h3>
                <div>
                    <button onClick={() => setVisibleEdit(true)}>
                        <Image src={'/components/edit.svg'} width={34} height={34} alt='editOperation'/>
                    </button>
                    <button onClick={() => {
                        deleteOperation(_id)
                            .then(res => {
                                setOperations((prevParts) => prevParts.filter((part) => part._id !== res.data))
                            })
                            .catch(e => console.log(e))
                    }}>
                        <Image src={'/components/delete.svg'} width={34} height={34} alt='deleteOperation'/>
                    </button>
                </div>
            </div>
                
            {periodMotorCheck !== '' && <h2>{periodMotorCheck + ' ' + categoryTech}</h2>}
            {description && <textarea ref={(el)=>refText.current[index] = el} value={description} readOnly/>}
            
            {/* Информация об исполнителях */}
            {executors && executors.length > 0 && (
                <div className="operation-executors">
                    <span className="executors-label">Исполнители:</span>
                    <div className="executors-list">
                        {executors.map((executor, idx) => (
                            <span key={idx} className="executor-name">
                                {executor}{idx < executors.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Использованные запчасти */}
            {usedParts && usedParts.length > 0 && (
                <div className="operation-parts">
                    <h4>Использованные запчасти:</h4>
                    <ul>
                        {usedParts.map((part, idx) => (
                            <li key={idx}>
                                {part.name} - {part.count} {part.unit}
                                {part.serialNumber && <span className="part-serial"> (S/N: {part.serialNumber})</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Информация о создателе записи */}
            {createdBy && (
                <div className="operation-creator">
                    <span>Последнее взаимодействие: {createdBy}</span>
                </div>
            )}
        </div>
    ) : (
        <EditOperation 
            _id={_id}
            setVisibleEdit={setVisibleEdit}
            periodMotorCheck={periodMotorCheck}
            description={description}
            date={date}
            executors={executors}
            usedParts={usedParts}
            setOperations={setOperations}
            workers={workers}
            parts={parts}
        />
    )
}