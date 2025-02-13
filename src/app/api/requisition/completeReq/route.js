import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import HistoryReq from "@/models/historyReq"
import Parts from "@/models/parts"
import Objects from "@/models/tech"
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const { _id, dateBegin, requests, dateEnd } = await req.json()
        // Получаем оригинальную заявку для информации о создателе
        const originalReq = await Requisition.findById(_id)
        if (!originalReq) {
            throw new Error('Заявка не найдена')
        }

        // Обрабатываем каждый запрос
        for (const request of requests) {

            // Находим объект в БД по ID
            const currentObject = await Objects.findById(request.obj);
            if (!currentObject) {
                console.error(`Объект не найден: ${request.obj}`);
                continue;
            }

            // Для каждой запчасти в запросе
            for (const part of request.parts) {

                // Находим запчасть в БД
                const currentPart = await Parts.findById(part._id);
                if (!currentPart) {
                    console.error(`Запчасть не найдена: ${part._id}`);
                    continue;
                }

                // 1. Привязываем запчасть к объекту
                if (!currentObject.bindingParts) {
                    currentObject.bindingParts = [];
                }
                const partExistsInObj = currentObject.bindingParts.some(
                    p => p._id.toString() === part._id.toString()
                );
                if (!partExistsInObj) {
                    currentObject.bindingParts.push({
                        _id: part._id,
                        name: currentPart.name
                    });
                }

                // 2. Привязываем объект к запчасти
                if (!currentPart.bindingObj) {
                    currentPart.bindingObj = [];
                }
                const objExistsInPart = currentPart.bindingObj.some(
                    obj => obj._id.toString() === currentObject._id.toString()
                );
                if (!objExistsInPart) {
                    currentPart.bindingObj.push({
                        _id: currentObject._id,
                        name: currentObject.name
                    });
                }

                // 3. Увеличиваем количество запчастей на складе
                currentPart.count += part.countReq;

                // Сохраняем изменения в запчасти
                await currentPart.save();
            }

            // Сохраняем изменения в объекте
            await currentObject.save();

            // Создаем запись в истории с полной информацией об объекте и запчастях
            const historyRecord = await HistoryReq.create({
                dateBegin: dateBegin,
                dateEnd: dateEnd,
                status: false,
                urgency: 'Закрыта',
                obj: {
                    _id: currentObject._id,
                    name: currentObject.name,
                    id: currentObject.id,
                    icon: currentObject.icon,
                    catagory: currentObject.catagory,
                    inspection: currentObject.inspection,
                    maintance: currentObject.maintance,
                    bindingParts: currentObject.bindingParts
                },
                parts: await Promise.all(request.parts.map(async (part) => {
                    const fullPart = await Parts.findById(part._id);
                    return {
                        _id: fullPart._id,
                        name: fullPart.name,
                        catagory: fullPart.catagory,
                        serialNumber: fullPart.serialNumber,
                        sellNumber: fullPart.sellNumber,
                        manufacturer: fullPart.manufacturer,
                        count: fullPart.count,
                        sum: fullPart.sum,
                        contact: fullPart.contact,
                        bindingObj: fullPart.bindingObj,
                        countReq: part.countReq,
                        description: part.description
                    };
                })),
                createdBy: originalReq.createdBy
            });
        }

        // Удаляем активную заявку
        const deletedReq = await Requisition.findOneAndDelete({_id: _id});
        
        return NextResponse.json(_id);
    }
    catch(e){
        console.error('Error in completeReq:', e);
        return NextResponse.json({ 
            error: e.message || 'Ошибка при завершении заявки'
        }, { status: 500 });
    }
}