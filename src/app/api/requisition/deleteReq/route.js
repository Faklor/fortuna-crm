import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()


    try{
        const { _id } = await req.json()

        const deleteReq = await Requisition.findOneAndDelete({_id:_id})

        return NextResponse.json(deleteReq)
    }
    catch(e){
        return NextResponse.json(e.message) 
    }

}