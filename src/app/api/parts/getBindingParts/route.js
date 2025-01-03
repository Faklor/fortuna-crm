import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {arrParts} = await req.json();
        
        let searchArr = arrParts.map(obj => obj._id)
        

        let search = await Part.find({_id:{$in:searchArr}})
        
       //console.log(search)
       if(search){
            return NextResponse.json(search)
       }
        
        
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}