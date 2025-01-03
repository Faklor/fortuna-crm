import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import Order from '@/models/orders'
import Operation from '@/models/operations'
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from "path"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id} = await req.json()

        const tech = await Tech.findOne({_id})

        if(tech){
            let obj = JSON.parse(JSON.stringify(tech))
            if(tech.icon !== 'Default.png'){
                fs.unlink(path.join(__dirname,`../../../../../../../src/res/iconsObjects/${obj.icon}`),(err, stats)=>{
                    console.log(stats)
                    if(err){
                        throw err
                    }
                })
            }
           
            const orders = await Order.deleteMany({ objectID: _id })
            const operations = await Operation.deleteMany({ objectID: _id })

            const deleteObj = await Tech.deleteOne({_id:obj._id})
            
        }
       

        


        return NextResponse.json(tech.icon)
    }
    catch(e){
        return NextResponse.json(e.message)
    }

}