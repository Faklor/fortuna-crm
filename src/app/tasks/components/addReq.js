import { useState, useEffect } from 'react'
import '../scss/addReq.scss'
import axios from 'axios'



export default function AddReq({setVisibleAdd, arrActive, objects, parts}){

    //default
    const selectedData = {}
    
    const arrUrgency = ['НЕ СРОЧНАЯ', 'СРЕДНЕЙ СРОЧНОСТИ', 'СРОЧНАЯ']
    const des = ['шт.', 'л.', 'см.', 'м.']
    let bindingParts = []
    let otherParts = [...parts]
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
    const [date, setSdate] = useState(formatDate(defaultDate))
    const [urgencySt, setUrgencySt] = useState(arrUrgency[0])
    const [objectSt, setObjectSt] = useState(JSON.stringify(objects[0]))
    const [selectDes, setSelectDes] = useState(des[0])
    //react-checked
    const [selectedParts, setSelectedParts] = useState([])
    const [partValues, setPartValues] = useState({})
    const [selectedDes, setSelectedDes] = useState({})
    const [err, setErr] = useState('')

    //logic
    const handleCheckboxChange = (event, partId) => {
        const isChecked = event.target.checked;
        if (isChecked) {
          // Добавляем выбранную часть в состояние
          setSelectedParts((prevSelected) => [...prevSelected, partId]);
        } 
        else {
          // Удаляем часть из состояния
          setSelectedParts((prevSelected) =>
            prevSelected.filter((id) => id !== partId)
          )
        }
    }
    const handleNumberInputChange = (event, partId) => {
        const value = event.target.value;
        setPartValues((prevValues) => ({ ...prevValues, [partId]: value }));
    }
    const handleSelectChange = (e, partId) => {
        const value = e.target.value;
        setSelectedDes((prevSelectedDes) => ({ ...prevSelectedDes, [partId]: value }));
    }

    if(parts.length !== 0){
        parts.forEach((part,index)=>{
            JSON.parse(objectSt).bindingParts.forEach(partInObj=>{
                if(partInObj._id === part._id){
                    bindingParts.push(part)
                    
                    otherParts.splice(index, 1)
                }
            })

        })
    }

    //functions
    async function createReq(selectedArr,urgencySt,date,objectID){
        return await axios.post('/api/requisition/addActive',{selectedArr:selectedArr,urgencySt:urgencySt,date:date,objectID:objectID})
    }
    

    
    return  <div className="addReq">
        <div className='message'>
            <button onClick={()=>setVisibleAdd(false)}>Назад</button>

            <input type='date' value={date} onChange={()=>setSdate(date)}/>
            <select onChange={e=>setUrgencySt(e.target.value)}>
                {arrUrgency.map((urgency, index)=>{
                    return <option key={index} value={urgency}>{urgency}</option>
                })}
            </select>
            <select onChange={e=>setObjectSt(e.target.value)}>
                {objects.map((obj,index)=>{
                    return <option key={index} value={JSON.stringify(obj)}>{obj.name}</option>
                })}
            </select>
            <p className='title'>Запчасти, привязанные к объекту</p>
            <div className='bindingParts'>
                {[...new Set(bindingParts)].map((item,index)=>{
                    return <div key={index} className='part'>
                        <input type='checkbox' value={item._id} onChange={(e) => handleCheckboxChange(e, item._id)}/>
                        <p>{item.name}</p>
                        {selectedParts.includes(item._id) && <div>
                            <input type="number" placeholder='Введите нужное кол-во' 
                            value={partValues[item._id] || ''} onChange={(e) => handleNumberInputChange(e, item._id)}/>
                            <select onChange={e=>handleSelectChange(e, item._id)} value={selectedDes[item._id] || ''}>
                                <option></option>
                                {des.map((item, index)=>{
                                    return <option key={index} value={item}>{item}</option>
                                })}
                            </select>
                        </div>}
                    </div>
                })}
            </div>
            <p className='title'>Запчасти, не привязанные к объекту</p>
            <div className='otherParts'>
                {[...new Set(otherParts)].map((item,index)=>{
                    return <div key={index} className='part'>
                        <input type='checkbox' value={item._id} onChange={(e) => handleCheckboxChange(e, item._id)}/>
                        <p>{item.name}</p>
                        {selectedParts.includes(item._id) && <div>
                            <input type="number" placeholder='Введите нужное кол-во' 
                            value={partValues[item._id] || ''} onChange={(e) => handleNumberInputChange(e, item._id)}/>
                            <select onChange={e=>handleSelectChange(e, item._id)} value={selectedDes[item._id] || ''}>
                                <option></option>
                                {des.map((item, index)=>{
                                    return <option key={index} value={item}>{item}</option>
                                })}
                            </select>
                        </div>}
                    </div>
                })}
            </div>
                
            <button onClick={()=>{
                let selectedArr = []
                selectedParts.forEach((partId) => {
                    
                    selectedArr.push({_id:partId, countReq:Number(partValues[partId] !== undefined?partValues[partId]:''), 
                        description:selectedDes[partId] !== undefined?selectedDes[partId]:''})
                  
                })

                if(selectedArr.length === 0){
                    setErr('Не выбраны запчасти')
                    
                }
                else{

                   

                    selectedArr.forEach((item)=>{
                        if(item.count <= 0){
                            
                            setErr('Не везде указано кол-во')        
                        }
                        else{
                            
                            
                        }
                    })

                        
                        setErr('')
                        createReq(selectedArr,urgencySt,date,JSON.parse(objectSt)._id)
                        .then(res=>{

                            arrActive.push(res.data)
                            setVisibleAdd(false)
                            
                        })
                        .catch(e=>console.log(e))
                    
                    
                }                
            }}>Создать заявку</button>

            <p>
            {
                err
            }
            </p>
        </div>
    </div>
}