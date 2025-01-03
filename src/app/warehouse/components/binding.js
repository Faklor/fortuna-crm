import '../scss/binding.scss'
import { useState, useEffect,useRef } from "react"
import Image from "next/image"
import axios from "axios"
//----------redux-----------
import { useSelector, useDispatch } from "react-redux"
import { editOnePart } from "@/store/slice/partsArray"

export default function Binding({
    setVisibleBinding, 
    bindingObj, 
    _id, 
    name, 
    index, 
    objects,

    setVisibleParts
}){
     
    //ref
    const defOptRef = useRef()
    //default
    let filterObj = [...objects]

    if(bindingObj.length !== 0){
       
        bindingObj.forEach(obj => {
            filterObj.forEach((el,index)=>{
                
                if(obj._id === el._id){
                    
                    filterObj.splice(index,1)
                    
                }
            })
        })
       
    }
    //console.log(filterObj)
    //react
    const [activeObj, setActiveObj] = useState('Выберите объект для привязки')    



    //functions
    async function sendBinding(part, obj){
        return await axios.post('/api/parts/bindingPart',{part:part,obj:obj})
    }
    async function deleteBinding(part, binding){
        return await axios.post('/api/parts/bindingPart/delPart',{part:part,binding:binding})
    }

    return <div className="binding">
        <button onClick={()=>setVisibleBinding(false)}>Назад</button>
        {bindingObj.length === 0?
            <p>Привязанных объектов нет</p>
        :
            <ol>
                <p>Привязанные объекты</p>

                {bindingObj.map((item,index)=>{
                    return <li key={index}>{item.name} <Image src={'/components/delete.svg'} width={34} height={34} alt="deleteBinding" 
                    onClick={async ()=>{
                        
                        deleteBinding({_id:_id, name:name}, item)
                        .then(res=>{

                            setVisibleParts((prevParts) => {
                                const updatedParts = [...prevParts];
                                const index = updatedParts.findIndex((item) => item._id === _id);
                                if (index !== -1) {
                                  updatedParts[index].bindingObj = res.data.bindingObj
                                }
                                return updatedParts;
                            })
                           
                        })
                        .catch(e=>{})
                    }}/></li>
                })}
            </ol>
            
        }

        <p>Привязка  объектов </p>

        <select onChange={e=>setActiveObj(e.target.value)} ref={defOptRef}>
            <option>Выберите объект для привязки</option>
            {filterObj.map((obj,index)=>{
                return <option key={index} value={JSON.stringify({_id:obj._id,name:obj.name})}>{obj.name}</option>
            })}
        </select>
        
        {activeObj !== 'Выберите объект для привязки'?<button onClick={async ()=>{
            
            sendBinding({_id:_id, name:name},JSON.parse(activeObj))
            .then(res=>{
                //console.log(res.data.bindingObj)
                // let data = {data:res.data, index:index}
                setActiveObj('Выберите объект для привязки')
                defOptRef.current.selectedIndex = 0
                

                // dispatch(editOnePart(data))
                setVisibleParts((prevParts) => {
                    const updatedParts = [...prevParts];
                    const index = updatedParts.findIndex((item) => item._id === _id);
                    if (index !== -1) {
                      updatedParts[index].bindingObj = res.data.bindingObj
                    }
                    return updatedParts;
                })
                
            })
            .catch(e=>console.log(e))
        }}>
            Добавить объект
        </button>:<button disabled className='disBtn'> Добавить объект</button>}
    </div>
}