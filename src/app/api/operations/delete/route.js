import dbConnet from "@/lib/db"
import Operation from '@/models/operations'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id} = await req.json();
        
        const operationDelete = await Operation.deleteOne({_id})
        

        return NextResponse.json(_id)
    }
    catch(e){   
        return NextResponse.json(e.message)
    }

}