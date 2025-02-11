import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(req) {
    await dbConnet()

    try {
        const { requests, urgencySt, date } = await req.json()
        const session = await getServerSession(authOptions)

        // Проверяем входные данные
        if (!Array.isArray(requests) || requests.length === 0) {
            return NextResponse.json(
                { error: 'Неверный формат данных запроса' },
                { status: 400 }
            )
        }

        // Удаляем дубликаты запчастей для каждого объекта
        const uniqueRequests = requests.map(request => ({
            obj: request.obj,
            parts: Array.from(new Set(request.parts.map(JSON.stringify)))
                .map(JSON.parse)
                .filter((part, index, self) => 
                    index === self.findIndex(p => p._id === part._id)
                )
        }));

        // Создаем заявку с уникальными данными и информацией о создателе
        const requisition = await Requisition.create({
            dateBegin: date,
            status: true,
            urgency: urgencySt,
            requests: uniqueRequests,
            createdBy: {
                userId: session.user.id,
                username: session.user.name,
                role: session.user.role
            }
        })

        // Логируем созданную заявку
        console.log('Created requisition:', requisition)

        return NextResponse.json(requisition)
    } catch (e) {
        console.error('Error creating requisition:', e)
        return NextResponse.json(
            { error: e.message || 'Ошибка при создании заявки' },
            { status: 500 }
        )
    }
}