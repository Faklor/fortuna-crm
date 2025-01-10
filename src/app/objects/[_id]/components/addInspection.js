import axios from "axios"
import { useState } from "react"
import { useRouter } from "next/navigation";

export default function AddInspection({ 
    period, 
    type, 
    objectID, 
    setOperations,
    listTypesOperations,
    setTypeOperation
}){
    
    //navigation
    const router = useRouter()
    //default
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
    const [periodOperation, setPeriod] = useState(period)
    const [beginDateOperation, setBeginDate] = useState(formatDate(defaultDate))
    const [descriptionOpertaion, setDescriptionOperation] = useState('')


    //functions
    async function setInspection(objectID, period, beginDate, date, type, description){
        return await axios.post('/api/operations/add',{objectID, period:period, beginDate: beginDate, date:date, type:type, description:description})
    }

    return(
        <div className="add">
            <p>Дата тех. осмотра</p>
            <input type='date' value={beginDateOperation} onChange={e=>setBeginDate(e.target.value)} placeholder='Дата предыдущего осмотра'/>
            <p>Период в годах</p>
            <input type='number' value={periodOperation} onChange={e=>setPeriod(e.target.value)} placeholder='Период'/>
            <textarea value={descriptionOpertaion} onChange={e=>setDescriptionOperation(e.target.value)} placeholder='Введите описание выполненной операции'/>

            <button onClick={async ()=>{
            setInspection(objectID, periodOperation, beginDateOperation, beginDateOperation, type, descriptionOpertaion)
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
    )
}