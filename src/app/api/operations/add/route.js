import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import Tech from '@/models/tech'
import { NextRequest, NextResponse } from "next/server"


export async function POST(req,res){
    await dbConnet()


    try{
        const {objectID, date, type, description, period, beginDate, periodMotor} = await req.json();

        if(type === 'Ремонт'){
            const operationAdd = await Operations.create({objectID, date, type, description})
            return NextResponse.json(operationAdd)
        }
        else if(type === 'Технический Осмотр' || type === 'Навигация'){
            const operationAdd = await Operations.create({objectID, date, type, description})
            const editInspection =  await Tech.findByIdAndUpdate({_id:objectID},{$set:{inspection:{dateBegin:beginDate, period:period}}})
            
            return NextResponse.json(operationAdd)
            
                
        }
        else if(type === 'Техническое обслуживание'){
            const operationAdd = await Operations.create({objectID, date, type, description, periodMotor})
            
            const editInspection =  await Tech.findByIdAndUpdate({_id:objectID},{$set:{maintance:{value:Number(periodMotor), period:period}}})
            
            return NextResponse.json(operationAdd)

        }
        
    }
    catch(e){   
        return NextResponse.json(e.message)
    }

}