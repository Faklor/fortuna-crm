'use client'
import { useState, useEffect } from 'react'
import '../scss/windowAddOperation.scss'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
//-------------components--------------
import Repair from './repair'
import AddInspection from './addInspection'
import AddMaintance from './addMaintance'

 
export default function Page({
    objectID, 
    setOperations, 
    category,
    workers,
    parts
}){
    
    //navigation
    const router = useRouter()
    const searchParams = useSearchParams()  
    //console.log(searchParams.get('name'))
    //default
    let listTypesOperations = ['Ремонт', 'Технический Осмотр', 'Техническое обслуживание', 'Навигация']
    
    
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
           
            setObj(res.data)
        })
        .catch(e=>{})
    },[])

    
    
    return searchParams.get('name') === 'addOperation'?<div className='windowAddOperation'>
        <div className='messageOperation'>
            <div className='controllers'>
                <button onClick={()=>{

                    router.push(`/objects/${objectID}`)
                    setTypeOperation(listTypesOperations[0])

                }}>Вернуться</button>
                <p>Добавление выполненной операции</p>
            </div>

            <select onChange={e=>setTypeOperation(e.target.value)}>
                {obj.catagory !== '🏢 Подразделения'?listTypesOperations.map((type,index)=>{
                    return <option key={index} value={type}>{type}</option>
                })
                :
                    <option value='Ремонт'>Ремонт</option>
                } 
            </select>
            {typeOperation === 'Ремонт' || typeOperation === 'Навигация'?
                <Repair 
                    type={typeOperation} 
                    objectID={objectID} 
                    setOperations={setOperations}
                    listTypesOperations={listTypesOperations}
                    setTypeOperation={setTypeOperation}
                    category={category}
                    workers={workers}
                    parts={parts}
                />
            :''}
            {typeOperation === 'Технический Осмотр'?<AddInspection 
            
                period={obj.inspection.period} 
                type={typeOperation} 
                objectID={objectID}

                setOperations={setOperations}
                listTypesOperations={listTypesOperations}
                setTypeOperation={setTypeOperation} 
                workers={workers}
                parts={parts}
            />:''}
            {typeOperation === 'Техническое обслуживание'?<AddMaintance 
            
                type={typeOperation} 
                objectID={objectID}
                category={obj.category}
                periodTO={obj.maintance.periodTO}

                setOperations={setOperations}
                listTypesOperations={listTypesOperations}
                setTypeOperation={setTypeOperation}
                workers={workers}
                parts={parts}
            />:''}

        </div>
    </div>:''
}