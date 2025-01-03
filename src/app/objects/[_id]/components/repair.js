import axios from "axios"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Repair({
    setVisibleAddOperation, 
    type,
    objectID,

    setOperations
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
    const [dateOpertaion, setDateOperation]  = useState(formatDate(defaultDate))
    const [descriptionOpertaion, setDescriptionOperation] = useState('')
    //functions
    async function addOperation(objectID, date, type, description){
        return await axios.post('/api/operations/add',{objectID:objectID, date:date, type:type, description:description})
    }

    return <div className="add">
        <p>Дата ремонта</p>
        <input type='date' value={dateOpertaion} onChange={e=>setDateOperation(e.target.value)}/>
        <textarea value={descriptionOpertaion} onChange={e=>setDescriptionOperation(e.target.value)} placeholder='Введите описание выполненной операции'/>
            
        <button onClick={async()=>{
            addOperation(objectID,dateOpertaion,type,descriptionOpertaion)
            .then(res=>{
                //console.log(res.data)
                setOperations((prevParts) => {
                    const updatedParts = [...prevParts, res.data];
                  
                    return updatedParts;
                })
                router.push(`/objects/${objectID}`)
               
            })
            .catch(e=>console.log(e))
        }}>Добавить</button>
    </div>
}