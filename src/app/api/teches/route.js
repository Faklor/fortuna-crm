'use server'
import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextRequest, NextResponse } from "next/server"

import { revalidateTag,revalidatePath  } from "next/cache";

export async function GET(req){
    await dbConnet()
    //const path = req.query.path || '/'

    try{
        const tech = await Tech.find({})
    
        return NextResponse.json({ revalidated: true, tech: tech })
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}