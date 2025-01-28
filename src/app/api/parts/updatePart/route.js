'use server'
import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id,name,catagory,contact,manufacturer,sellNumber,serialNumber,sum,storageId} = await req.json()

        let contactObg = {
            name:contact.name,
            link:contact.link
        }
        
        const partEdit = await Part.findOneAndUpdate({_id:_id},
        {$set:{
            catagory:catagory,
            name:name,
            serialNumber:serialNumber,
            sellNumber:sellNumber,
            manufacturer:manufacturer,
            sum:sum,
            contact:contactObg,
            storageId:storageId
        }})
        if(partEdit){
            const nowPart = await Part.find({_id:_id})
            return NextResponse.json(JSON.stringify({title:'updatePart',data:nowPart[0]}))
        }
        
        
        
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}