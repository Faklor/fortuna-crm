import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id,count} = await req.json();
        
        //console.log(count)
        const updateCountPart = await Part.findOneAndUpdate({_id},{count:count})
        const nowPart = await Part.find({_id})
        

        return NextResponse.json(JSON.stringify({title:'updateCountPart',data:nowPart[0]}))
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}