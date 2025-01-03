import Image from 'next/image'
import axios from 'axios'
import { useState, useEffect } from 'react';
import '../scss/completeReq.scss'

export default function CompleteReq({partsOption, setErr, dateBegin, object, _id, arrActive, setArrActive, workers}){

    //default
    let arr = []
    let defaultDate = new Date().toLocaleDateString()

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
    let createDataEnd = formatDate(defaultDate)

    //react
    const [visible, setVisible] = useState(false)
    const [worker, setWorker] = useState('')

    //functions
    async function completeReq(_id, dateBegin, object, partsOption, dateNow, workerName){
        return await axios.post('/api/requisition/completeReq', {_id:_id, dateBegin:dateBegin, object:object, partsOption:partsOption, dateNow:dateNow, workerName:workerName})
    }

    useEffect(()=>{
        if(workers.length !== 0){
            setWorker(workers[0].name)
        }
    })
   
    function validation(){

        partsOption.forEach((item,index)=>{
            if(item._doc.count < item.countReq ){
                arr.push(`Запчасть №${index+1}`)
                //setErr(err.toSpliced(index,0,`Запчасть №${index+1}`))
            }
        })

        if(arr.length !== 0){
            setErr(arr)
        }
        else{
            setErr([])
            setVisible(true)
            
        }
        //console.log(err)
    }

    return !visible?<button onClick={()=>{
        validation()
        
    }}>Завершить 
        <Image src={'/components/complete.svg'} 
        width={20} 
        height={20} 
        alt="completeReq"/>
    </button>
    :
    <div className='addWorker'>
        <div className='message'>
            <p>Укажите работника,которому выдаете</p>
            <select onClick={e=>setWorker(e.target.value)}>
                {workers.map((item,index)=>{
                    return <option key={index} value={item.name}>{item.name}</option>
                })}
            </select>

            <div className='btns'>
                <button onClick={()=>{
                    completeReq(_id, dateBegin, object, partsOption, createDataEnd, worker)
                    .then(res=>{
                        arrActive.forEach((item,index)=>{
                            
                            if(item._id === res.data){
                                setArrActive(arrActive.toSpliced(index,1)) 
                                
                            }
                        })
                        setVisible(false)
                        //console.log(arrActive)
                    })
                    .catch(e=>console.log(e))
                }}>Завершить</button>
                <button onClick={()=>setVisible(false)}>Назад</button>
            </div>
        </div>
    </div>
}