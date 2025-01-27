import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import Parts from '@/models/parts'
import Order from '@/models/orders'
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(req){
    await dbConnet()

    try {
        // Получаем текущего пользователя
        const session = await getServerSession(authOptions)
        const currentUser = session?.user?.name || 'Неизвестный пользователь'

        const {
            _id,
            description,
            periodMotor,
            date,
            executors,
            usedParts
        } = await req.json()

        // Получаем текущую операцию для сравнения
        const currentOperation = await Operations.findById(_id)

        // Обрабатываем изменения в количестве запчастей
        if (currentOperation.usedParts && usedParts) {
            for (const newPart of usedParts) {
                const oldPart = currentOperation.usedParts.find(p => p._id.toString() === newPart._id.toString())
                if (oldPart && oldPart.count !== newPart.count) {
                    // Если было 5, стало 1, то на склад нужно вернуть 4
                    // Если было 5, стало 8, то со склада нужно забрать 3
                    const difference = oldPart.count - newPart.count // Положительная разница - возврат на склад
                    
                    // Обновляем количество на складе
                    const updatedPart = await Parts.findByIdAndUpdate(
                        newPart._id,
                        { $inc: { count: difference } },
                        { new: true }
                    )

                    // Проверяем, что обновление прошло успешно
                    if (!updatedPart) {
                        throw new Error(`Не удалось обновить количество для детали ${newPart.name}`)
                    }

                    // Обновляем запись о выдаче с указанием типа операции
                    const updatedOrder = await Order.findOneAndUpdate(
                        {
                            objectID: currentOperation.objectID,
                            'part._id': newPart._id,
                            date: currentOperation.date
                        },
                        { 
                            $set: { 
                                countPart: newPart.count,
                                workerName: executors[0],
                                operationType: 'operation' // указываем, что выдача произошла после операции
                            } 
                        },
                        { new: true }
                    )

                    if (!updatedOrder) {
                        throw new Error(`Не удалось обновить запись о выдаче для детали ${newPart.name}`)
                    }
                }
            }
        }

        // Обновляем операцию, включая createdBy
        const updatedOperation = await Operations.findByIdAndUpdate(
            _id,
            {
                description,
                periodMotor,
                date,
                executors,
                usedParts,
                createdBy: currentUser
            },
            { new: true }
        )

        return NextResponse.json(updatedOperation)
    } catch(e) {
        return NextResponse.json({ 
            error: e.message || 'Ошибка при обновлении операции',
            details: e.stack
        }, { status: 500 })
    }
}