import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import { NextRequest, NextResponse } from "next/server"

export async function GET(req){
    await dbConnet()


    try{
        const reqs  = await Requisition.find({})

        return NextResponse.json(reqs)
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}