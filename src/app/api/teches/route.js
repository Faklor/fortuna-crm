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
        // const tag = req.nextUrl.searchParams.get('objects')
        // revalidateTag(tag)
        // const path = req.nextUrl.searchParams.get('path')
        // if (path) {
        //     revalidatePath(path)
        //     return NextResponse.json({ revalidated: true, tech: tech })
        //   }
        //await res.unstable_revalidate(path)
        //console.log(req.query)
        return NextResponse.json({ revalidated: true, tech: tech })
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}