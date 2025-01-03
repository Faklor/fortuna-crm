import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import Tech from "@/models/tech"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {part, obj} = await req.json();
        
        
        const bindingPart = await Part.findOneAndUpdate({_id:part._id}, {$push:{bindingObj:obj}})

        if(bindingPart){
            const bindingObj  = await Tech.findOneAndUpdate({_id:obj._id}, {$push:{bindingParts:part}})
            if(bindingObj){
                const newPart = await Part.findOne({_id:part._id})
                return NextResponse.json(newPart)
            }
            const newPart = await Part.findOne({_id:part._id})
            return NextResponse.json(newPart)
        }
        else{
            return NextResponse.json('err')
        }
        
        
        
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}