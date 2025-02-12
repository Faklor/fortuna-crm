import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import Parts from '@/models/parts'
import Orders from '@/models/orders'
import { NextResponse } from "next/server"

export async function POST(req, res) {
    await dbConnet()

    try {
        const { objectId, parts: selectedParts, workerName, date } = await req.json()

        // Проверяем существование объекта
        const currentObject = await Tech.findById(objectId)
        if (!currentObject) {
            return NextResponse.json({ 
                success: false, 
                error: 'Объект не найден' 
            }, { status: 404 })
        }

        const orders = []
        const updatedParts = []

        // Обрабатываем каждую запчасть
        for (const part of selectedParts) {
            // Находим запчасть в БД
            const currentPart = await Parts.findById(part.partId)
            if (!currentPart) {
                console.error(`Запчасть не найдена: ${part.partId}`)
                continue
            }

            // Создаем новый заказ для каждой запчасти
            const order = await Orders.create({
                date: date || new Date(),
                workerName,
                objectID: objectId,
                part: {
                    _id: currentPart._id,
                    name: currentPart.name,
                    catagory: currentPart.catagory,
                    manufacturer: currentPart.manufacturer || '',
                    sellNumber: currentPart.sellNumber || '',
                    serialNumber: currentPart.serialNumber || '',
                    contact: currentPart.contact || {},
                    sum: currentPart.sum || 0
                },
                countPart: parseInt(part.count),
                description: part.description || 'шт.',
                operationType: 'manual'
            })

            orders.push(order)

            // 1. Привязываем запчасть к объекту
            if (!currentObject.bindingParts) {
                currentObject.bindingParts = []
            }
            const partExistsInObj = currentObject.bindingParts.some(
                p => p._id.toString() === part.partId.toString()
            )
            if (!partExistsInObj) {
                currentObject.bindingParts.push({
                    _id: part.partId,
                    name: currentPart.name,
                    count: parseInt(part.count),
                    description: part.description
                })
            }

            // 2. Привязываем объект к запчасти
            if (!currentPart.bindingObj) {
                currentPart.bindingObj = []
            }
            const objExistsInPart = currentPart.bindingObj.some(
                obj => obj._id.toString() === currentObject._id.toString()
            )
            if (!objExistsInPart) {
                currentPart.bindingObj.push({
                    _id: currentObject._id,
                    name: currentObject.name
                })
            }

            // 3. Уменьшаем количество запчастей на складе
            currentPart.count -= parseInt(part.count)

            // Сохраняем изменения в запчасти
            await currentPart.save()
            updatedParts.push(currentPart)
        }

        // Сохраняем изменения в объекте
        await currentObject.save()

        return NextResponse.json({ 
            success: true, 
            orders,
            updatedParts,
            message: 'Запчасти успешно выданы' 
        })

    } catch (e) {
        console.error('Error adding parts:', e)
        return NextResponse.json({ 
            success: false, 
            error: e.message 
        }, { status: 500 })
    }
} 