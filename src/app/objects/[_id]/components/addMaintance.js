import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";


export default function AddMaintance({ 
    type, 
    objectID, 
    category, 
    periodTO, 
    setOperations,
    listTypesOperations,
    setTypeOperation
}){

    //navigation
    const router = useRouter()
    //default
    const categoryTech = category === '🔆' || category === '💧' || category === '🚜' || category === '📦'?true:false
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
    const [periodMotor, setPeriodMotor] = useState('')
    const [period, setPeriod] = useState(periodTO)
    const [beginDateOperation, setBeginDate] = useState(formatDate(defaultDate))
    const [descriptionOpertaion, setDescriptionOperation] = useState('')


    //functions
    async function setInspection(objectID,period, periodMotor, beginDate, date, type, description){
        return await axios.post('/api/operations/add',{objectID, period:period, periodMotor:periodMotor, beginDate: beginDate, date:date, type:type, description:description})
    }

    return <div className="add">


        <p>Дата тех. обслуживания</p>
        <input type='date' value={beginDateOperation} onChange={e=>setBeginDate(e.target.value)} placeholder='Дата предыдущего осмотра'/>

        {categoryTech?<p>Моточасы</p>:<p>Пробег</p>}
        <input type='number' value={periodMotor} onChange={e=>setPeriodMotor(e.target.value)} placeholder={categoryTech?'Моточасы (ч.)':'Пробег (км.)'}/>
        {categoryTech?<p>Период моточасов</p>:<p>Период пробега</p>}
        <input type='number' value={period} onChange={e=>setPeriod(e.target.value)} placeholder={categoryTech?'Моточасы (ч.)':'Пробег (км.)'}/>

        <textarea value={descriptionOpertaion} onChange={e=>setDescriptionOperation(e.target.value)} placeholder='Введите описание выполненной операции'/>

        <button onClick={async()=>{
            setInspection(objectID,period, periodMotor, beginDateOperation, beginDateOperation, type, descriptionOpertaion)
            .then(res=>{
                setOperations((prevParts) => {
                    const updatedParts = [...prevParts, res.data];
                  
                    return updatedParts;
                })
                router.push(`/objects/${objectID}`)
                setTypeOperation(listTypesOperations[0])
            })
            .catch(e=>console.log(e))
        }}>Добавить</button>   
    </div>
}