import dbConnect from "@/lib/db";
import Parts from "@/models/parts";
import Workers from "@/models/workers";
import Requisition from '@/models/requisition'
import Orders from "@/models/orders";
import HistoryReq from "@/models/historyReq";

import Tech from "@/models/tech";
import { unstable_cache } from 'next/cache'
import Image from "next/image";
//----------components------------
import ListTasks from './components/listTaks'


export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({}){
    
    //db
    await dbConnect()
    const parts = await Parts.find({})
    const workers = await Workers.find({})
    const objects = await Tech.find({})
    const requisition = await Requisition.find({})
    const historyReq = await HistoryReq.find({})
    const orders = await Orders.find({})
    //default 
    let visibleParts = JSON.stringify(await parts)
    let visibleWorkers = JSON.stringify(await workers)
    let visibleObjects = JSON.stringify(await objects)
    let visibleRequisition = JSON.stringify(await requisition)
    let visibleHistoryReq = JSON.stringify(await historyReq)
    let visibleOrders = JSON.stringify(await orders)

    return <ListTasks 
        visibleParts={visibleParts}
        visibleWorkers={visibleWorkers}
        visibleObjects={visibleObjects}
        visibleRequisition={visibleRequisition}
        visibleHistoryReq={visibleHistoryReq}
        visibleOrders={visibleOrders}
    />
}


