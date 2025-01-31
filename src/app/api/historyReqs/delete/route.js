import dbConnect from "@/lib/db"
import HistoryReq from "@/models/historyReq"
import Order from "@/models/orders"
import Parts from "@/models/parts"
import { NextResponse } from "next/server"

export async function POST(req) {
    try {
        await dbConnect()
        const { _id } = await req.json()

        if (!_id) {
            return NextResponse.json({ error: "ID не указан" }, { status: 400 })
        }

        // Находим заявку перед удалением
        const historyReq = await HistoryReq.findById(_id)

        if (!historyReq) {
            return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
        }

        console.log('HistoryReq found:', historyReq) // Добавим лог для проверки

        // Возвращаем запчасти на склад и удаляем записи о выдаче
        for (const part of historyReq.parts) {
            // Находим запчасть на складе и обновляем количество
            await Parts.findOneAndUpdate(
                { _id: part._id },
                { $inc: { count: part.count } }
            )

            // Ищем и удаляем записи о выдаче
            await Order.deleteMany({
                date: historyReq.dateEnd,
                workerName: historyReq.workerName,
                objectID: historyReq.obj._id,
                'part._id': part._id,
                countPart: part.count,
                description: part.description,
                operationType: 'request'
            })

        }

        // Удаляем саму заявку из архива
        await HistoryReq.findByIdAndDelete(_id)

        return NextResponse.json({ 
            message: "Заявка успешно удалена, запчасти возвращены на склад" 
        })

    } catch (error) {
        console.error('Error in delete route:', error)
        return NextResponse.json({ 
            error: "Внутренняя ошибка сервера",
            details: error.message 
        }, { status: 500 })
    }
} 