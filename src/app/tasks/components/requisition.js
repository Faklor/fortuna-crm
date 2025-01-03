import axios from "axios"
import { useEffect, useState } from "react"
import '../scss/requisition.scss'


//--------------components------------------
import AddReq from "./addReq"
import ActiveReq from "./activeReq"

export default function Requisition({requisition,setRequisition,workers,objects,parts}){

    //react
    const [visibleAdd, setVisibleAdd] = useState(false)
     

    return <div className="requisition">
        <div className="title">
            <h2>Заявки</h2>
            <button onClick={()=>setVisibleAdd(true)}>Добавить</button>
        </div>
        
        {requisition.length === 0?<p>Активных заявок нету</p>:
        <div>
            {requisition.map((item, index)=>{
                return <ActiveReq {...item} key={index} index={index} arrActive={requisition} setArrActive={setRequisition} workers={workers}/>
            })}
        </div>}


        {visibleAdd?<AddReq setVisibleAdd={setVisibleAdd} arrActive={requisition} objects={objects} parts={parts}/>:''}
    </div>
    
    
}