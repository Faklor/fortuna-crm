import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Users from '@/models/users'
import { hash } from 'bcryptjs'

export async function GET() {
    try {
        await dbConnect()
        const users = await Users.find({}, { password: 0 }) // Исключаем пароль из выдачи
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        await dbConnect()
        const { login, password, role } = await request.json()

        // Проверка существования пользователя
        const existingUser = await Users.findOne({ login })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Пользователь с таким логином уже существует' },
                { status: 400 }
            )
        }

        // Хеширование пароля
        const hashedPassword = await hash(password, 12)

        // Создание пользователя
        const user = await Users.create({
            login,
            password: hashedPassword,
            role
        })

        // Возвращаем пользователя без пароля
        const { password: _, ...userWithoutPassword } = user.toObject()
        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}