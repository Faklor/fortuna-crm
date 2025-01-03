import dbConnet from "@/lib/db"
import Wokrer from '@/models/workers'
import { NextRequest, NextResponse } from "next/server"

export async function GET(){
    await dbConnet()


    try{
        const worker = await Wokrer.find({})

        return NextResponse.json(worker)
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}