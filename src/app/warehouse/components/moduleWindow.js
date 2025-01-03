import '../scss/moduleWindow.scss'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ModuleWindow({
    _id,
    name,
    catagory,
    contact,
    count,
    manufacturer,
    sellNumber,
    serialNumber,
    sum,
    index, 
    workers, 
    teches,
    sendVisible, 
    setSendVisible,

    setVisibleParts
}){

    //console.log(teches[0]?teches[0].name:'')
    //default 
   
    const des = ['шт.', 'л.', 'см.', 'м.']
    //react
    const [sendCount, setSendCount] = useState(count)
    const [sendWorker, setWorker] = useState('')
    const [sendObject, setObject] = useState('')
    const [sendDes, setSendDes] = useState(des[0])

    useEffect(()=>{
        if(workers[0]){
            setWorker(workers[0].name)
        }
        if(teches[0]){
            setObject(teches[0]._id)
        }

        setSendCount(count)
    },[workers,teches, count])

    //default
    let part = {
        _id:_id,
        name:name,
        catagory:catagory,
        manufacturer:manufacturer,
        sellNumber:sellNumber,
        serialNumber:serialNumber,
        contact:contact,
        sum:sum
    }
    

    //function
    async function SendPart(workerName, objectID, part, count, des){

       return await axios.post('/api/parts/sendPart', {date:new Date(), workerName:workerName, objectID:objectID, part:part, count:count, des:des})
    }

    return sendVisible?<div className="moduleWindow">
        <div className='message'>
            <div className='title'>
                <h2>Выдача запчасти</h2>
                <button onClick={()=>setSendVisible(false)}><Image src={'/components/close.svg'} width={40} height={40} alt='closeWindow'/></button>
            </div>
            
            <p>{name}</p>
            {manufacturer?<p>Производитель: {manufacturer}</p>:''}
            {sellNumber?<p>Товарный номер: {sellNumber}</p>:''}
            {serialNumber?<p>Серийный номер: {serialNumber}</p>:''}
            {sum?<p>Цена: {sum}</p>:''}
            <hr/>
            <br/>
            <p>Выберите работника</p>
            <select className='workers' onChange={(e)=>{setWorker(e.target.value)}}>
                {workers.map((worker,index)=>{
                    return <option key={index} value={worker.name}>{worker.name}</option>
                })}
            </select>
            <p>Выберите Объект</p>
            <select className='objects' onChange={(e)=>{setObject(e.target.value)}}>
                {teches.map((tech,index)=>{
                    return <option key={index} value={tech._id}>{tech.name}</option>
                })}
            </select>
            <br/>
            <p>Выберите кол-во</p>
            <div className='controllersWindow'> 
                <div>
                    <input type='number' value={sendCount} onChange={e=>{
                        if(e.target.value > count){

                        }
                        else if(e.target.value <= 0){

                        }
                        else{
                            setSendCount(e.target.value)
                        }
                        }}/>
                    <select onChange={(e)=>setSendDes(e.target.value)}>
                        {des.map((item,index)=>{
                            return <option key={index} value={item}>{item}</option>
                        })}
                    </select>
                </div>
                
                <button onClick={async ()=>{
                    SendPart(sendWorker,sendObject,part,Number(sendCount),sendDes)
                    .then(res=>{
                        //console.log(res.data)
                        //console.log(JSON.stringify(res.data).data)

                        setVisibleParts((prevParts) => {
                            const updatedParts = [...prevParts];
                            const index = updatedParts.findIndex((item) => item._id === _id);
                            if (index !== -1) {
                              updatedParts[index] = { ...updatedParts[index], count: JSON.parse(res.data).data.count };
                            }
                            return updatedParts;
                        })

                    })
                    .catch(e=>{
                        console.log(e)
                    })
                    
                }}>Выдать</button>
            </div>
        </div>
    </div>:<></>
}