import dbConnet from "@/lib/db"
import Operation from '@/models/operations'
import Parts from '@/models/parts'
import Order from '@/models/orders'
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const {_id} = await req.json();
        
        // Получаем операцию перед удалением
        const operation = await Operation.findOne({_id})
        
        if (operation && operation.usedParts && operation.usedParts.length > 0) {
            // Возвращаем запчасти на склад
            for (const part of operation.usedParts) {
                await Parts.findByIdAndUpdate(
                    part._id,
                    { $inc: { count: part.count } }
                )
            }
            
            // Удаляем записи о выдаче запчастей
            await Order.deleteMany({
                objectID: operation.objectID,
                date: operation.date,
                workerName: operation.executors[0]
            })
        }
        
        // Удаляем саму операцию
        await Operation.deleteOne({_id})
        
        return NextResponse.json(_id)
    }
    catch(e) {   
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}