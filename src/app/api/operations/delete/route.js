import dbConnet from "@/lib/db"
import Operation from '@/models/operations'
import Parts from '@/models/parts'
import Orders from '@/models/orders'
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const {_id} = await req.json()
        
        // Получаем операцию перед удалением
        const operation = await Operation.findById(_id)
        
        if (!operation) {
            return NextResponse.json({ error: 'Операция не найдена' }, { status: 404 })
        }

        // Если у операции есть использованные запчасти, возвращаем их на склад
        if (operation.usedParts && operation.usedParts.length > 0) {
            for (const part of operation.usedParts) {
                // Используем сохраненный _id напрямую
                const updatedPart = await Parts.findByIdAndUpdate(
                    part._id,
                    { $inc: { count: Number(part.count) } },
                    { new: true }
                )
                
                console.log('Обновленное количество:', updatedPart.count)
            }

            // Удаляем записи о выдаче запчастей
            await Orders.deleteMany({
                objectID: operation.objectID,
                date: operation.date,
                workerName: operation.executors[0]
            })
        }

        // Удаляем операцию
        await Operation.findByIdAndDelete(_id)
        
        return NextResponse.json({ success: true, _id })
    }
    catch(e) {   
        console.error('Ошибка при удалении операции:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}