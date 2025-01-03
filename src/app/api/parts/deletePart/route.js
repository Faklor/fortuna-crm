import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id} = await req.json();
        
        
        const deletePart = await Part.deleteOne({_id})
        
        return NextResponse.json(JSON.stringify({title:'deletePart', data:_id}))
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}