import dbConnet from "@/lib/db"
import Order from '@/models/orders'
import Part from "@/models/parts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id, part, count} = await req.json();
        
        const partOld = await Part.find({_id:part._id})
        if(partOld){
            const setCount = await Part.findOneAndUpdate({_id:part._id},{$set:{count:partOld[0].count + count}})
        }
        
        const ordersDelete = await Order.deleteOne({_id})
        //console.log(partOld[0].count, count)

        return NextResponse.json(_id)
    }
    catch(e){   
        return NextResponse.json(e.message)
    }

}