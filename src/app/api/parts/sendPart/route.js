import dbConnet from "@/lib/db"
import Order from '@/models/orders'
import Parts from "@/models/parts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {date, workerName, objectID, part, count,des } = await req.json()
        

        
        const findOldPart = await Parts.findOne({_id:part._id})
        let new_Part = ''


        if(findOldPart){
            let old_count =  findOldPart.count 
            const new_count_part = await Parts.findOneAndUpdate({_id:part._id},{$set:{count:old_count-count}})
            const newOrder = await Order.create({date:date, workerName:workerName, objectID:objectID, part:part, countPart:Number(count),description:des})
            new_Part = await Parts.find({_id:part._id})
            
        }
             
        

        return NextResponse.json(JSON.stringify({title:'sendPart',data:new_Part[0]}))
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}