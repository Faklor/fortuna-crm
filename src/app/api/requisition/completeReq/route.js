import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import Order from '@/models/orders'
import HistoryReq from "@/models/historyReq"
import Parts from "@/models/parts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()


    try{
        const { _id, dateBegin, object, partsOption, dateNow, workerName} = await req.json()


        const createHistoryItem = await HistoryReq.create({dateBegin:dateBegin,dateEnd:dateNow,status:false,urgency:'Закрыта',obj:object,parts:partsOption})

        if(createHistoryItem){

            partsOption.forEach(async (el) => {
                let newCount = el._doc.count - el.countReq
                let findUpdate = await Parts.findOneAndUpdate({_id:el._doc._id},{$set:{count:newCount}})
                let newOrder = await Order.create({date:dateNow, workerName:workerName, objectID:object._id, part:el._doc, countPart:Number(el.countReq), description:el.description})
            })

            
            const deleteActiveReq = await Requisition.findOneAndDelete({_id:_id})

            return NextResponse.json(_id)
        }       
        //console.log(_id, dateBegin, object, partsOption)

       
        
        
    }
    catch(e){
        return NextResponse.json(e.message) 
    }

}