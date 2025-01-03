import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"

export async function GET(){
    await dbConnet()


    try{
        const part = await Part.find({})

        return NextResponse.json(part)
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}