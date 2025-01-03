'use server'
import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextRequest, NextResponse } from "next/server"

// async function fetchData(){
//     const nowDate = new Date()

//     //console.log(nowDate.getHours(),nowDate.getMinutes(),nowDate.getSeconds())
//     console.log(nowDate.getSeconds())

//     if(nowDate.getHours() === 9 && nowDate.getMinutes() === 20 && nowDate.getSeconds() === 0){
//         console.log('da')
//     }
// }

// setInterval(fetchData,1000)

export async function GET(){
    await dbConnet()


    try{
        const tech = await Tech.find({})

        return NextResponse.json(tech)
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}