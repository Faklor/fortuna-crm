import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import { NextRequest, NextResponse } from "next/server"


export async function POST(req,res){
    await dbConnet()


    try{
        const {_id} = await req.json();
        
        const operation = await Operations.find({objectID:_id})
        

        return NextResponse.json(operation)
    }
    catch(e){   
        return NextResponse.json(e.message)
    }

}