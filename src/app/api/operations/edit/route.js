import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import Tech from '@/models/tech'
import { NextRequest, NextResponse } from "next/server"


export async function POST(req,res){
    await dbConnet()


    try{
        const {_id, date, description, periodMotor} = await req.json();
        
        
        const editOperation = await Operations.findOneAndUpdate({_id:_id}, {$set:{date:date, description:description, periodMotor:periodMotor}})
        
        if(editOperation){
            const newOperation = await Operations.findOne({_id:_id})

            return NextResponse.json(newOperation)
        }

        
        
    }
    catch(e){   
        return NextResponse.json(e.message)
    }

}