import dbConnet from "@/lib/db"
import Parts from '@/models/parts'
import Order from '@/models/orders'
import { NextResponse } from "next/server"

export async function POST(req) {
    await dbConnet()

    try {
        const { parts, objectID, date, workerName, description } = await req.json()

        // Обрабатываем каждую запчасть
        for (const part of parts) {
            // Проверяем наличие достаточного количества на складе
            const currentPart = await Parts.findById(part._id)
            if (!currentPart || currentPart.count < part.count) {
                return NextResponse.json({ 
                    error: `Недостаточное количество ${part.name} на складе` 
                }, { status: 400 })
            }

            // Уменьшаем количество на складе
            await Parts.findByIdAndUpdate(
                part._id,
                { $inc: { count: -part.count } }
            )

            // Создаем запись о выдаче с типом 'manual' (выдача со склада)
            await Order.create({
                date,
                workerName,
                objectID,
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
                description: part.unit,
                operationType: 'operation' // указываем, что это ручная выдача со склада
            })
        }

        return NextResponse.json({ 
            success: true,
            message: 'Запчасти успешно списаны'
        })
    } catch (e) {
        return NextResponse.json({ 
            error: e.message,
            details: 'Ошибка при списании запчастей'
        }, { status: 500 })
    }
} 