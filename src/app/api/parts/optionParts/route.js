import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import Parts from "@/models/parts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()


    try{
        const { partsArr } = await req.json()

        const findParts = await Parts.find({_id:{$in:partsArr}})
        
        if(findParts){
            // findParts.forEach((item1,index1)=>{
            //     partsArr.forEach((item2,index2)=>{
            //         if((item1._id).toString() === item2._id){
            //             Object.assign(item1, item2._countReq)
            //         }
            //     })
            // })
    
            // console.log(findParts)
            const combinedArray = findParts.map((item1) => {
                const matchingItem = partsArr.find((item2) => item2._id === (item1._id).toString());
                return {
                  ...item1,
                  countReq: matchingItem ? matchingItem.countReq : 0,
                  description: matchingItem ? matchingItem.description : '',
                };
            })

            

            //console.log(combinedArray)
            return NextResponse.json(combinedArray)
        }
        

        
    }
    catch(e){
        return NextResponse.json(e.message) 
    }

}