import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import Tech from "@/models/tech"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()


    try{
        const {part, binding} = await req.json();
        
        // console.log(part)
        //console.log(binding)
        const bindingPart = await Part.findOneAndUpdate({_id:part._id}, {$pull:{bindingObj:{_id:binding._id}}})
        //console.log(bindingPart)
        if(bindingPart){
            const objects = await Tech.findOneAndUpdate({_id:binding._id}, {$pull:{bindingParts:{_id:part._id}}})
            if(objects){
                const newPart = await Part.findOne({_id:part._id})

                return NextResponse.json(newPart)
            }
            
        }

        // if(bindingPart){
        //     const bindingObj  = await Tech.findOneAndUpdate({_id:obj._id}, {$push:{bindingParts:part}})
        //     if(bindingObj){
        //         const newPart = await Part.findOne({_id:part._id})
        //         return NextResponse.json(newPart)
        //     }
        //     const newPart = await Part.findOne({_id:part._id})
        //     return NextResponse.json(newPart)
        // }
        // else{
        //     return NextResponse.json('err')
        // }
        //return NextResponse.json('')
        
        
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}