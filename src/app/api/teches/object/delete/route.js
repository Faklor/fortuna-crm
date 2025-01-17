import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import Order from '@/models/orders'
import Operation from '@/models/operations'
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs/promises'
import path from "path"

export async function POST(req, res) {
    await dbConnet()

    try {
        const { _id } = await req.json()
        const tech = await Tech.findOne({ _id })

        if (tech) {
            // Удаляем файл изображения, если он существует и это не Default.png
            if (tech.icon?.fileName && tech.icon.fileName !== 'Default.png') {
                try {
                    const filePath = path.join(process.cwd(), 'uploads', 'imgsObjects', tech.icon.fileName)
                    await fs.unlink(filePath)
                } catch (error) {
                    console.error('Error deleting image file:', error)
                    // Продолжаем выполнение даже если файл не удалось удалить
                }
            }

            // Удаляем связанные данные
            await Promise.all([
                Order.deleteMany({ objectID: _id }),
                Operation.deleteMany({ objectID: _id }),
                Tech.deleteOne({ _id })
            ])

            return NextResponse.json({ 
                success: true, 
                message: 'Объект и все связанные данные успешно удалены' 
            })
        }

        return NextResponse.json({ 
            success: false, 
            error: 'Объект не найден' 
        }, { status: 404 })

    } catch (e) {
        console.error('Error deleting tech:', e)
        return NextResponse.json({ 
            success: false, 
            error: e.message 
        }, { status: 500 })
    }
}