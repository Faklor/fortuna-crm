import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextResponse } from "next/server"
import path from 'path'
import fs from 'fs/promises'

export async function POST(req, res) {
    await dbConnet()

    try {
        const formData = await req.formData()
        const { _id, name, category, organization, description, captureWidth } = Object.fromEntries(formData)
        const imgTitle = formData.get('imgTitle')

        const updateData = {
            name,
            catagory: category,
            organization,
            description
        }

        if (category === '🚃 Прицепы') {
            const numericCaptureWidth = parseFloat(captureWidth);
            if (!isNaN(numericCaptureWidth)) {
                updateData.captureWidth = numericCaptureWidth;
            } else {
                updateData.captureWidth = 0;
            }
        } else {
            updateData.captureWidth = null;
        }

        // Получаем текущий объект для проверки старого файла
        const existingTech = await Tech.findById(_id)

        if (imgTitle && imgTitle !== 'null') {
            const byteLength = await imgTitle.arrayBuffer()
            const bufferData = Buffer.from(byteLength)
            
            // Создаем папку uploads/imgsObjects если её нет
            const uploadsDir = path.join(process.cwd(), 'uploads', 'imgsObjects')
            await fs.mkdir(uploadsDir, { recursive: true })
            
            // Получаем расширение файла
            const fileExtension = imgTitle.name.split('.').pop()
            
            // Используем _id объекта как имя файла
            const fileName = `${_id}.${fileExtension}`
            
            // Удаляем старый файл если он существует и это не Default.png
            if (existingTech?.icon?.fileName && existingTech.icon.fileName !== 'Default.png') {
                try {
                    await fs.unlink(path.join(process.cwd(), 'uploads', 'imgsObjects', existingTech.icon.fileName))
                } catch (error) {
                    console.error('Error deleting old file:', error)
                }
            }
            
            // Сохраняем новый файл
            await fs.writeFile(path.join(uploadsDir, fileName), bufferData)
            
            // Обновляем информацию о файле в БД
            updateData.icon = {
                fileName: fileName,
                contentType: imgTitle.type
            }
        }

        const updateTech = await Tech.findOneAndUpdate(
            { _id },
            { $set: updateData },
            { new: true }
        )

        if (updateTech) {
            return NextResponse.json({ newTech: updateTech })
        }

        return NextResponse.json({ error: 'Object not found' }, { status: 404 })

    } catch (e) {
        console.error('Update error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
  




