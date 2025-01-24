'use client'
import { useState, useEffect } from 'react'
import './scss/windowAddOperation.scss'
import axios from 'axios'
import { usePathname, useRouter } from 'next/navigation'
import { OPERATION_TYPES } from '../../constants/operationTypes'
//-------------components--------------
import Repair from './components/repair'
import AddInspection from './components/addInspection'
import AddMaintance from './components/addMaintance'

export default function Page({}){
    
    //navigation
    const router = useRouter()
    const pathname = usePathname()
    const objectID = pathname.split('/')[2]

    //default
    const listTypesOperations = Object.keys(OPERATION_TYPES)
    
    //react
    const [typeOperation, setTypeOperation] = useState(listTypesOperations[0])
    const [obj, setObj] = useState({})
    //functions
    async function getObject(_id){
        return await axios.post('/api/teches/object', {_id:_id})
    }

    useEffect(()=>{
        getObject(objectID)
        .then(res=>{
            // if(res.data.catagory === '🏠 Подразделения'){
            //     listTypesOperations = ['Ремонт']
            // }

            setObj(res.data)
        })
        .catch(e=>{})
    },[pathname])


    return <div className='windowAddOperation'>
        <div className='messageOperation'>
            <div className='controllers'>
                <button onClick={()=>router.push(`/objects/${objectID}`)}>Вернуться</button>
                <p>Добавление выполненной операции</p>
            </div>

            <select 
                onChange={e=>setTypeOperation(e.target.value)}
                style={{
                    backgroundColor: OPERATION_TYPES[typeOperation].color,
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none'
                }}
            >
                {listTypesOperations.map((type, index) => (
                    <option 
                        key={index} 
                        value={type}
                        style={{
                            backgroundColor: 'white',
                            color: OPERATION_TYPES[type].color
                        }}
                    >
                        {OPERATION_TYPES[type].emoji} {type}
                    </option>
                ))}
            </select>

            <div style={{ marginTop: '20px' }}>
                {typeOperation === 'Ремонт' || typeOperation === 'Навигация' ? (
                    <div style={{ 
                        borderLeft: `4px solid ${OPERATION_TYPES[typeOperation].color}`,
                        paddingLeft: '10px'
                    }}>
                        <Repair 
                            type={typeOperation} 
                            objectID={objectID} 
                        />
                    </div>
                ) : null}
                
                {typeOperation === 'Технический Осмотр' ? (
                    <div style={{ 
                        borderLeft: `4px solid ${OPERATION_TYPES[typeOperation].color}`,
                        paddingLeft: '10px'
                    }}>
                        <AddInspection 
                            period={obj.inspection?.period} 
                            type={typeOperation} 
                            objectID={objectID}
                        />
                    </div>
                ) : null}
                
                {typeOperation === 'Техническое обслуживание' ? (
                    <div style={{ 
                        borderLeft: `4px solid ${OPERATION_TYPES[typeOperation].color}`,
                        paddingLeft: '10px'
                    }}>
                        <AddMaintance 
                            type={typeOperation} 
                            objectID={objectID}
                            category={obj.category}
                            periodTO={obj.maintance?.periodTO}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    </div>
}