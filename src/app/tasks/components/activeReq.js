import { useState, useEffect } from "react"
import '../scss/activeReq.scss'
import axios from "axios"
import Image from "next/image"
import { useRouter } from "next/navigation";
//------------component--------------
import CompleteReq from "./completeReq"
 

export default function ActiveReq({_id, index, dateBegin, urgency, obj, parts, setArrActive, arrActive, workers}){
    
    //navigation
    const router = useRouter()
    //react
    const [object, setObject] = useState(obj)
    const [partsOption, setPartsOptions] = useState([])
    const [err, setErr] = useState([])

    

    //functions
    async function getObj(_id){
        return await axios.post('/api/teches/object',{_id:_id})
    }
    async function getParts(partsArr){
        return await axios.post('/api/parts/optionParts', {partsArr:partsArr})
    }
    async function deleteReq(_id){
        return await axios.post('/api/requisition/deleteReq',{_id:_id})
    }

    function getColor(){
        if(urgency === 'НЕ СРОЧНАЯ'){
            return '#A9FF8F'
        }
        else if(urgency === 'СРЕДНЕЙ СРОЧНОСТИ'){
            return '#FFE48D'
        }
        else if((urgency === 'СРОЧНАЯ')){
            return '#FF8181'
        }
    }

    useEffect(()=>{
        getObj(obj)
        .then(res=>{
            setObject(res.data)
        })
        .catch(e=>console.log(e))

        getParts(parts)
        .then(res=>{
            setPartsOptions(res.data)
        })
        .catch(e=>console.log(e))

    },[])

    

    return <div className="reqActive">
        <div style={{background:getColor()}} className="lineStatus"/>
        <div className="titleReq">
            <h2 style={{color:getColor()}}>Заявка №{index+1}</h2>

            <p>Дата начала: {dateBegin}</p>
            <p>Срочность: {urgency}</p>
            <p>Объект: {object.name}</p>
        </div>
        
        <div className="contollers">
            <CompleteReq 
                partsOption={partsOption} 
                setErr={setErr}
                object={object}
                dateBegin={dateBegin}
                _id={_id}
                arrActive={arrActive}
                setArrActive={setArrActive}
                workers={workers}
            />
            <button>Редактировать<Image src={'/components/edit.svg'} width={20} height={20} alt="completeReq"/></button>
            <button onClick={()=>{
                
                deleteReq(_id)
                .then(res=>{
                    arrActive.map((item,index)=>{
                        
                        if(item._id === _id){
                            setArrActive(arrActive.toSpliced(index,1)) 
                        }
                    })
                })
                .catch(e=>console.log(e))
            }}>Отменить<Image src={'/components/close.svg'} width={20} height={20} alt="completeReq"/></button>
        </div>

        {partsOption.map((item,index)=>{
            return <div key={index} className="partReq">
                <h3 onClick={()=>router.push(`/warehouse?id=${item._doc._id}`)}>Запчасть {index +1}:</h3>
                <div className="count">
                    <p>{item._doc.name + ' ' + item._doc.manufacturer}</p>
                    <p>Нужно: {item.countReq +' '+ item.description}</p>
                    <p>Имеется: {item._doc.count}</p>
                </div>
            </div>
        })}

        {err.length !== 0?
        <p style={{color:'#FF8181', margin:'0.5em 0 0 0'}}>
            На складе не имеется кол-во запчастей согласно заявке 
        </p>
        :''}
    </div>
}