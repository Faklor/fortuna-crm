import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()

    try{
        const {category,name,manufacturer,serialNumber,sellNumber,count,sum,contact,storageId} = await req.json();
        
        const addPart = await Part.create({
            catagory:category,
            name:name,
            manufacturer:manufacturer,
            serialNumber:serialNumber,
            sellNumber:sellNumber,
            count:count,
            sum:sum,
            contact:contact,
            storageId:storageId
        })
        //console.log(addPart)
        return NextResponse.json(JSON.stringify({title:'addPart',data:addPart}))
    }
    catch(e){
        return NextResponse.json(e.message)
    }
}