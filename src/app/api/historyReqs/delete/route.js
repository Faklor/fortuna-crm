import dbConnet from "@/lib/db"
import HistoryReq from "@/models/historyReq"
import Order from "@/models/orders"
import Parts from "@/models/parts"
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const { _id } = await req.json()

        // Получаем данные заявки перед удалением
        const historyReq = await HistoryReq.findOne({ _id: _id })
        if (!historyReq) {
            throw new Error('История заявки не найдена')
        }

        // Находим все orders связанные с этой заявкой
        const orders = await Order.find({
            date: historyReq.dateEnd,
            workerName: historyReq.workerName,
            objectID: historyReq.obj
        })

        // Возвращаем запчасти на склад
        for (const order of orders) {
            const part = order.part
            await Parts.findOneAndUpdate(
                { _id: part._id },
                { $inc: { count: order.countPart } }
            )
        }

        // Удаляем orders
        await Order.deleteMany({
            date: historyReq.dateEnd,
            workerName: historyReq.workerName,
            objectID: historyReq.obj
        })

        // Удаляем саму заявку из истории
        const deletedHistoryReq = await HistoryReq.findOneAndDelete({ _id: _id })

        return NextResponse.json(deletedHistoryReq)
    }
    catch(e){
        console.error('Error in deleteHistoryReq:', e)
        return NextResponse.json({ 
            error: e.message || 'Internal Server Error',
            details: 'Ошибка при удалении заявки из архива'
        }, { status: 500 })
    }
} 