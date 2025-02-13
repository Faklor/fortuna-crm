import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import Tech from '@/models/tech'
import Parts from '@/models/parts'
import { NextRequest, NextResponse } from "next/server"


export async function POST(req,res){
    await dbConnet()


    try{
        const {
            objectID, 
            date, 
            type, 
            description, 
            period, 
            beginDate, 
            periodMotor,
            executors,
            usedParts,
            createdBy
        } = await req.json();

        // Получаем объект для привязки
        const currentObject = await Tech.findById(objectID)
        if (!currentObject) {
            throw new Error('Объект не найден')
        }

        // Обрабатываем привязки для каждой запчасти
        for (const part of usedParts) {
            // Находим запчасть в БД
            const currentPart = await Parts.findById(part._id)
            if (!currentPart) {
                console.error(`Запчасть не найдена: ${part._id}`)
                continue
            }

            // 1. Привязываем запчасть к объекту
            if (!currentObject.bindingParts) {
                currentObject.bindingParts = []
            }
            const partExistsInObj = currentObject.bindingParts.some(
                p => p._id.toString() === part._id.toString()
            )
            if (!partExistsInObj) {
                currentObject.bindingParts.push({
                    _id: part._id,
                    name: currentPart.name
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

            // Сохраняем изменения в запчасти
            await currentPart.save()
        }

        // Сохраняем изменения в объекте
        await currentObject.save()

        if(type === 'Ремонт' || type === 'Навигация'){
            const operationAdd = await Operations.create({
                objectID, 
                date, 
                type, 
                description,
                periodMotor,
                executors,
                createdBy,
                usedParts: usedParts.map(part => ({
                    _id: part._id,
                    name: part.name,
                    serialNumber: part.serialNumber,
                    manufacturer: part.manufacturer,
                    count: part.count,
                    sum: part.sum,
                    unit: part.unit
                }))
            })
            return NextResponse.json(operationAdd)
        }
        else if(type === 'Технический Осмотр' ){
            const operationAdd = await Operations.create({
                objectID, 
                date, 
                type, 
                description,
                executors,
                usedParts: usedParts.map(part => ({
                    _id: part._id,
                    name: part.name,
                    serialNumber: part.serialNumber,
                    manufacturer: part.manufacturer,
                    count: part.count,
                    sum: part.sum,
                    unit: part.unit
                })),
                createdBy
            })
            
            // Проверяем категорию объекта
            const specialCategories = ['🚜 Трактора', '💧 Опрыскиватели', '🔆 Комбайны', '📦 Погрущики']
            
            if (specialCategories.includes(currentObject.catagory)) {
                await Tech.updateMany(
                    { catagory: currentObject.catagory },
                    { $set: { inspection: { dateBegin: beginDate, period: Number(period) } } }
                )
            } else {
                await Tech.findByIdAndUpdate(
                    { _id: objectID },
                    { $set: { inspection: { dateBegin: beginDate, period: Number(period) } } }
                )
            }
            
            return NextResponse.json(operationAdd)
        }
        else if(type === 'Техническое обслуживание'){
            const operationAdd = await Operations.create({
                objectID, 
                date, 
                type, 
                description, 
                periodMotor,
                executors,
                usedParts: usedParts.map(part => ({
                    _id: part._id,
                    name: part.name,
                    serialNumber: part.serialNumber,
                    manufacturer: part.manufacturer,
                    count: part.count,
                    sum: part.sum,
                    unit: part.unit
                })),
                createdBy
            })
            
            await Tech.findByIdAndUpdate(
                { _id: objectID },
                { $set: { maintance: { value: Number(periodMotor), period: Number(period) } } }
            )
            
            return NextResponse.json(operationAdd)

        }
        
    }
    catch(e){   
        return NextResponse.json({ error: e.message }, { status: 500 })
    }

}