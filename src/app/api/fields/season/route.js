import dbConnet from "@/lib/db"
import Seasons from '@/models/seasons'
import { NextRequest, NextResponse } from "next/server"

export async function GET(){
    await dbConnet()
    

    try{
        //const add = await Seasons.create({name:'2025'})
        const seasons = await Seasons.find({})
        //console.log(Seasons)
        return NextResponse.json(seasons)
        //return NextResponse.json('')
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}