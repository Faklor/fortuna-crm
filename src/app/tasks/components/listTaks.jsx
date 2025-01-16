'use client'
import { useState } from "react"
import '../scss/listTasks.scss'
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
    const [parts, setParts] = useState(JSON.parse(visibleParts))
    const [workers, setWorkers] = useState(JSON.parse(visibleWorkers))
    const [objects, setObjects] = useState(JSON.parse(visibleObjects))
    const [requisition, setRequisition] = useState(JSON.parse(visibleRequisition))
    const [historyReq, setHistoryReq] = useState(JSON.parse(visibleHistoryReq))
    const [orders, setOrders] = useState(JSON.parse(visibleOrders)) 

    return (
        <div className="tasks">
            <div className="tasks-container">
                {/* Левая часть */}
                <div className="content">
                    
                    <NoticesInspection className="section notices-section" objects={objects}/>
                    <SeasonalWorks className="section seasonal-section"/>
                    
                </div>

                {/* Правая часть */}
                <div className="sidebar">
                    <Requisition 
                        className="section requisition-section"
                        requisition={requisition}
                        setRequisition={setRequisition} 
                        workers={workers} 
                        objects={objects}
                        parts={parts}
                    />
                    <HistoryReqs className="section history-section"/>
                </div>
            </div>
        </div>
    )
}