import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import Order from '@/models/orders'
import HistoryReq from "@/models/historyReq"
import Parts from "@/models/parts"
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const { _id, dateBegin, requests, dateNow } = await req.json()

        // Получаем оригинальную заявку для информации о создателе
        const originalReq = await Requisition.findById(_id)
        if (!originalReq) {
            throw new Error('Original requisition not found')
        }

        // Получаем актуальные данные о запчастях
        const uniquePartIds = [...new Set(requests.flatMap(req => 
            req.parts.map(part => part._id)
        ))];
        
        const currentParts = await Parts.find({ _id: { $in: uniquePartIds } }).lean();
        const partsMap = currentParts.reduce((acc, part) => {
            acc[part._id.toString()] = part;
            return acc;
        }, {});

        // Подсчитываем общее количество запчастей для вычета
        const totalPartsCount = {};
        requests.forEach(request => {
            request.parts.forEach(part => {
                if (!totalPartsCount[part._id]) {
                    totalPartsCount[part._id] = 0;
                }
                totalPartsCount[part._id] += part.countReq;
            });
        });

        // Обновляем количество запчастей на складе один раз
        for (const [partId, totalCount] of Object.entries(totalPartsCount)) {
            const currentPart = partsMap[partId];
            if (!currentPart) continue;

            const newCount = currentPart.count - totalCount;
            if (isNaN(newCount)) {
                throw new Error(`Invalid count calculation for part ${partId}`);
            }

            await Parts.findOneAndUpdate(
                { _id: partId },
                { $set: { count: newCount } }
            );
        }

        // Создаем записи в истории для каждого объекта
        for (const request of requests) {
            // Создаем запись в истории с информацией о создателе
            await HistoryReq.create({
                dateBegin: dateBegin,
                dateEnd: dateNow,
                workerName: request.workerName,
                status: false,
                urgency: 'Закрыта',
                obj: request.obj,
                parts: request.parts,
                createdBy: originalReq.createdBy
            });

            // Создаем записи о выдаче для каждой запчасти
            for (const part of request.parts) {
                const currentPart = partsMap[part._id];
                if (!currentPart) continue;

                await Order.create({
                    date: dateNow,
                    workerName: request.workerName,
                    objectID: request.obj,
                    part: currentPart,
                    countPart: Number(part.countReq),
                    description: part.description,
                    operationType: 'request'
                });
            }
        }

        // Удаляем активную заявку после обработки всех объектов
        const deleteActiveReq = await Requisition.findOneAndDelete({_id: _id});
        return NextResponse.json(_id);
    }
    catch(e){
        console.error('Error in completeReq:', e);
        return NextResponse.json({ 
            error: e.message || 'Internal Server Error',
            details: 'Ошибка при завершении заявки'
        }, { status: 500 });
    }
}