import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextResponse } from "next/server"
import fs from 'fs/promises'
import path from "path"

export async function POST(req, res) {
  await dbConnet()

  try {
    const formData = await req.formData()
    const { name, category, organization, description, captureWidth } = Object.fromEntries(formData)
    const icon = formData.get('icon')

    // Базовый объект для создания
    const techData = {
      name,
      catagory: category,
      organization,
      description,
      icon: 'Default.png',
      inspection: {
        dateBegin: "",
        period: 0
      },
      maintance: {
        value: 0,
        period: 0
      },
    }

    // Добавляем захват если это прицеп
    if (category === '🚃 Прицепы') {
      if (captureWidth) {
        const numericCaptureWidth = parseFloat(captureWidth);
        if (!isNaN(numericCaptureWidth)) {
          techData.captureWidth = numericCaptureWidth;
        }
      } else {
        techData.captureWidth = 0;
      }
    }

    // Создаем объект в базе данных
    const newTech = await Tech.create(techData)

    // Обработка загрузки иконки
    if (icon && icon !== 'null') {
      const byteLength = await icon.arrayBuffer()
      const bufferData = Buffer.from(byteLength)
      
      // Создаем папку uploads/imgsObjects если её нет
      const uploadsDir = path.join(process.cwd(), 'uploads', 'imgsObjects')
      await fs.mkdir(uploadsDir, { recursive: true })
      
      // Получаем расширение файла
      const fileExtension = icon.name.split('.').pop()
      
      // Используем _id объекта как имя файла
      const fileName = `${newTech._id}.${fileExtension}`
      
      // Сохраняем файл
      await fs.writeFile(path.join(uploadsDir, fileName), bufferData)
      
      // Обновляем информацию о файле в БД
      const updatedTech = await Tech.findByIdAndUpdate(
        newTech._id,
        {
          icon: {
            fileName: fileName,
            contentType: icon.type
          }
        },
        { new: true }
      )

      return NextResponse.json({ newTech: updatedTech })
    }

    return NextResponse.json({ newTech })

  } catch (e) {
    console.error('Error creating tech:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
  




