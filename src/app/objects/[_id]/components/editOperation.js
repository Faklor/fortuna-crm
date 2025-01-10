import { useState } from "react"
import axios from "axios"
import '../scss/editOperation.scss'


export default function EditOperation({
    _id, 
    setVisibleEdit, 
    description, 
    periodMotorCheck, 
    date,

    setOperations
}){

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
    
    
    return <div className="operation edit-mode">
        <button onClick={()=>setVisibleEdit(false)}>Назад</button>
        
        <h2>Редактирование операции</h2>
        <input type='date' value={dateEdit} onChange={e=>setDateEdit(e.target.value)} placeholder='Дата'/>
        {periodMotor !== ''?<input type="number" value={periodMotor} onChange={e=>setPeriodMotor(e.target.value)}/>:''}
        <textarea style={{border:'1px solid black'}} value={descriptionOpertaion} onChange={(e)=>setDescriptionOperation(e.target.value)} placeholder="Введите описание выполненной операции"/>

        <button onClick={()=>{
            editOp(_id,descriptionOpertaion,periodMotor, dateEdit)
            .then(res=>{
                //console.log(res.data)
                setOperations((prevParts) => {
                    const updatedParts = [...prevParts];
                    const index = updatedParts.findIndex((item) => item._id === _id);
                    if (index !== -1) {
                      updatedParts[index] = res.data;
                    }
                    return updatedParts;
                })
            })
            .catch(e=>console.log(e))
        }}>Редактировать</button>
    </div>
}