import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import Parts from '@/models/parts'
import Order from '@/models/orders'
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const {
            _id, 
            date, 
            description, 
            periodMotor,
            executor,
            usedParts: newUsedParts
        } = await req.json();
        
        // Получаем текущую операцию
        const currentOperation = await Operations.findById(_id)
        const currentParts = currentOperation.usedParts || []
        
        if (newUsedParts) {
            // Возвращаем старые запчасти на склад
            for (const part of currentParts) {
                await Parts.findByIdAndUpdate(
                    part._id,
                    { $inc: { count: part.count } }
                )
            }
            
            // Удаляем старые записи о выдаче
            await Order.deleteMany({
                'part._id': { $in: currentParts.map(p => p._id) },
                'objectID': currentOperation.objectID,
                'date': currentOperation.date
            })
            
            // Списываем новые запчасти
            for (const part of newUsedParts) {
                await Parts.findByIdAndUpdate(
                    part._id,
                    { $inc: { count: -part.count } }
                )
                
                // Создаем новые записи о выдаче
                await Order.create({
                    date,
                    workerName: executor,
                    objectID: currentOperation.objectID,
                    part: {
                        _id: part._id,
                        name: part.name,
                        catagory: part.catagory,
                        serialNumber: part.serialNumber,
                        sellNumber: part.sellNumber,
                        manufacturer: part.manufacturer,
                        sum: part.sum
                    },
                    countPart: part.count,
                    description: part.unit
                })
            }
        }
        
        // Обновляем операцию
        const editOperation = await Operations.findOneAndUpdate(
            {_id}, 
            {
                $set: {
                    date,
                    description,
                    periodMotor,
                    executor,
                    usedParts: newUsedParts
                }
            },
            { new: true }
        )
        
        return NextResponse.json(editOperation)
    }
    catch(e) {   
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}