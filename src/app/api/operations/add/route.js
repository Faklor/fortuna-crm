import dbConnet from "@/lib/db"
import Operations from '@/models/operations'
import Tech from '@/models/tech'
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
            createdBy,
            usedParts
        } = await req.json();

        if(type === 'Ремонт'){
            const operationAdd = await Operations.create({
                objectID, 
                date, 
                type, 
                description,
                periodMotor,
                executors,
                createdBy,
                usedParts
            })
            return NextResponse.json(operationAdd)
        }
        else if(type === 'Технический Осмотр' || type === 'Навигация'){
            const operationAdd = await Operations.create({
                objectID, 
                date, 
                type, 
                description,
                executors
            })
            
            // Получаем информацию об объекте
            const techObject = await Tech.findById(objectID)
            
            // Проверяем категорию объекта
            const specialCategories = ['🚜 Трактора', '💧 Опрыскиватели', '🔆 Комбайны', '📦 Погрущики'] // Комбайны, Опрыскиватели, Погрузчики, Трактора
            
            if (specialCategories.includes(techObject.catagory)) {
                // Для специальных категорий обновляем все объекты той же категории
                const updateAllSameCategory = await Tech.updateMany(
                    { catagory: techObject.catagory },
                    { $set: { inspection: { dateBegin: beginDate, period: period } } }
                )
            } else {
                // Для остальных категорий обновляем только текущий объект
                const editInspection = await Tech.findByIdAndUpdate(
                    { _id: objectID },
                    { $set: { inspection: { dateBegin: beginDate, period: period } } }
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
                executors
            })
            
            const editInspection =  await Tech.findByIdAndUpdate({_id:objectID},{$set:{maintance:{value:Number(periodMotor), period:period}}})
            
            return NextResponse.json(operationAdd)

        }
        
    }
    catch(e){   
        return NextResponse.json({ error: e.message }, { status: 500 })
    }

}