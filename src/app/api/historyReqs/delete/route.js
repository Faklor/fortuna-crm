import dbConnet from "@/lib/db"
import HistoryReq from "@/models/historyReq"
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const { _id } = await req.json()

        // Просто удаляем заявку из истории
        const deletedHistoryReq = await HistoryReq.findOneAndDelete({ _id: _id })

        if (!deletedHistoryReq) {
            throw new Error('История заявки не найдена')
        }

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