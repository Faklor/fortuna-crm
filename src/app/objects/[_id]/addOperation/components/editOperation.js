import { useState } from "react"
import axios from "axios"


export default function EditOperation({_id, setVisibleEdit, type, description, periodMotorCheck, date, setOperations, operations}){

    //default
    //const categoryTech = category === '🔆' || category === '💧' || category === '🚜' || category === '📦'?'м.ч.':'км.'

    
    //react
    const [periodMotor, setPeriodMotor] = useState(periodMotorCheck)
    const [descriptionOpertaion, setDescriptionOperation] = useState(description)
    const [dateEdit, setDateEdit] = useState(date)

    //functions
    async function editOp(_id,description,periodMotor, dateEdit){
        return await axios.post('/api/operations/edit', {_id:_id, description:description,periodMotor:periodMotor, date:dateEdit})
    }
    
    
    return <div className="operation">
        <button onClick={()=>setVisibleEdit(false)}>Назад</button>
        
        <h2>Редактирование операции</h2>
        <input type='date' value={dateEdit} onChange={e=>setDateEdit(e.target.value)} placeholder='Дата'/>
        {periodMotor !== ''?<input type="number" value={periodMotor} onChange={e=>setPeriodMotor(e.target.value)}/>:''}
        <textarea style={{border:'1px solid black'}} value={descriptionOpertaion} onChange={(e)=>setDescriptionOperation(e.target.value)} placeholder="Введите описание выполненной операции"/>

        <button onClick={()=>{
            editOp(_id,descriptionOpertaion,periodMotor, dateEdit)
            .then(res=>{
                let arr = []

                operations.forEach(element => {
                    if(element._id === _id){
                        arr.push(res.data)
                    }
                    else{
                        arr.push(element)
                    }  
                })
                //console.log(operations)
                setOperations(arr)
                setVisibleEdit(false)
            })
            .catch(e=>console.log(e))
        }}>Редактировать</button>
    </div>
}