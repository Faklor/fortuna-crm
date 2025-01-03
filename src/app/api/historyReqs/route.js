import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HistoryReq from "@/models/historyReq";

export async function POST(req){
    dbConnect()

    try{
        const { date } = await req.json()
        
        const history = await HistoryReq.find({dateEnd:date})
        if(history){
            return NextResponse.json(history)
        }
        
        
    }   
    catch(e){
        return NextResponse.json(e)
    } 
}