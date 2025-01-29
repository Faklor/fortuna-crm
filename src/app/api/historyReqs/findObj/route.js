import dbConnet from "@/lib/db"
import Request from "@/models/historyReq"
import { NextResponse } from "next/server"

export async function POST(req,res){
    await dbConnet()

    try{
        const {_id} = await req.json();

        // Ищем заявки где obj._id совпадает с переданным _id и status: false (закрытые заявки)
        const requests = await Request.find({
            'obj._id': _id,
            status: false
        })

        return NextResponse.json(requests)
    }
    catch(e){   
        console.error("Error in requests route:", e);
        return NextResponse.json(e.message)
    }
}