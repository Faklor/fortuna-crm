'use client'
import axios from "axios"
import '../scss/bindingParts.scss'
import { useRouter } from "next/navigation";
import Image from "next/image"
import { useEffect, useState } from "react"

export default  function BindingParts({bindingParts}){


    //navigation
    const router = useRouter()
    //react
    const [parts, setParts] = useState([])


    //functions
    async function getBindingParts(arrParts){
        return await axios.post('/api/parts/getBindingParts', {arrParts:arrParts})
    }

    useEffect(()=>{
        getBindingParts(bindingParts)
        .then(res=>{
            //console.log(res.data)
            setParts(res.data)
        })
        .catch(e=>console.log(e))
    },[])


    return parts.length !== 0?<div className="BindingParts"> 
       
        {parts.map((part,index)=>{
            return <div className="bindingPart" key={index}>
                <Image src={`/catagoryParts/${part.catagory}.svg`} width={10} height={10} alt='listPart'/>
                <p>{part.manufacturer?part.name + ' ( ' + part.manufacturer + ' )':part.name}</p>
                <button onClick={()=>router.push(`/warehouse/#${part._id}`)}>
                    <Image src={'/components/to.svg'} width={10} height={10} alt="toPart"/>
                </button>
            </div>
        })} 
        
    </div>
    :
    <div className="BindingParts">
        <h2>Привязанных запчастей нету</h2>
    </div>
}