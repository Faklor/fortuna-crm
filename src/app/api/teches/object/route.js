import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id} = await req.json()

        const tech = await Tech.findOne({_id})

        return NextResponse.json(tech)
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}