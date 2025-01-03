import dbConnet from "@/lib/db"
import Part from '@/models/parts'
import Tech from '@/models/tech'
import Worker from '@/models/workers'
import Order from '@/models/orders'
import { NextRequest, NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()


    try{
        const {_id} = await req.json();
        
        const ordersOfTech = await Order.find({objectID:_id})
        

        return NextResponse.json(ordersOfTech)
    }
    catch(e){   
        return NextResponse.json(e.message)
    }

}