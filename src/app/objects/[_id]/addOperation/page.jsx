'use client'
import { useState, useEffect } from 'react'
import './scss/windowAddOperation.scss'
import axios from 'axios'
import { usePathname, useRouter } from 'next/navigation'
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

            <select onChange={e=>setTypeOperation(e.target.value)}>
                {listTypesOperations.map((type,index)=>{
                    return <option key={index} value={type}>{type}</option>
                })}
            </select>
            {typeOperation === 'Ремонт' || typeOperation === 'Навигация'?<Repair 
             
            type={typeOperation} 
            objectID={objectID} 
            />:''}
            {typeOperation === 'Технический Осмотр'?<AddInspection 
            
            period={obj.inspection.period} 
            type={typeOperation} 
            objectID={objectID}
            />:''}
            {typeOperation === 'Техническое обслуживание'?<AddMaintance 
            
            type={typeOperation} 
            objectID={objectID}
            category={obj.category}
            periodTO={obj.maintance.periodTO}
            />:''}

        </div>
    </div>
}