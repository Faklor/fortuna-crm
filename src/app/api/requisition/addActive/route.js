import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import Parts from "@/models/parts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()


    try{
        const { selectedArr,urgencySt,date,objectID } = await req.json()

        //const findParts = await Parts.find({_id:{$in:selectedArr}})
        //console.log(selectedArr,urgencySt,date,object)
        const createReq = await Requisition.create({dateBegin:date,status:Boolean(true),urgency:urgencySt,obj:objectID,parts:selectedArr})

        return NextResponse.json(createReq)
    }
    catch(e){
        return NextResponse.json(e.message) 
    }

}