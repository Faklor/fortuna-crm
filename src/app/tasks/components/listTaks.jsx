'use client'
import { useState } from "react"
//--------------components-------------------
import Requisition from './requisition'
import NoticesInspection from "./noticesInspection"
import HistoryReqs from "./historyReqs"
import SeasonalWorks from "./seasonalWorks"

export default function ListTasks({
    visibleParts,
    visibleWorkers,
    visibleObjects,
    visibleRequisition,
    visibleHistoryReq,
    visibleOrders
}){

    //react
    const [parts, setParts] = useState(JSON.parse(visibleParts))
    const [workers, setWorkers] = useState(JSON.parse(visibleWorkers))
    const [objects, setObjects] = useState(JSON.parse(visibleObjects))
    const [requisition, setRequisition] = useState(JSON.parse(visibleRequisition))
    const [historyReq, setHistoryReq] = useState(JSON.parse(visibleHistoryReq))
    const [orders, setOrders] = useState(JSON.parse(visibleOrders)) 

    //react-visible
    

    return <>
        <SeasonalWorks />
        <Requisition 
            requisition={requisition}
            setRequisition={setRequisition} 
            workers={workers} 
            objects={objects}
            parts={parts}
        />
        <NoticesInspection objects={objects}/>
        <HistoryReqs />
    </>
}