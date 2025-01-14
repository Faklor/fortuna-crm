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
    const formData = await req.formData()
    const { name, category, organization, description, captureWidth } = Object.fromEntries(formData)
    const icon = formData.get('icon')

    // Базовый объект для создания
    const techData = {
      name,
      catagory: category, // Здесь мы сохраняем как catagory из-за модели
      organization,
      description,
    }

    // Добавляем захват если это прицеп
    if (category === '🚃 Прицепы') {
      if (captureWidth) {
        const numericCaptureWidth = parseFloat(captureWidth);
        if (!isNaN(numericCaptureWidth)) {
          techData.captureWidth = numericCaptureWidth;
        }
      } else {
        // Если захват не указан, добавляем значение по умолчанию
        techData.captureWidth = 0;
      }
    }

    // Добавляем иконку если она есть
    if (icon && icon !== 'null') {
      const byteLength = await icon.arrayBuffer()
      const bufferData = Buffer.from(byteLength)
      
      techData.icon = {
        data: bufferData,
        contentType: icon.type,
        fileName: icon.name
      }
    } else {
      techData.icon = null
    }


    const newTech = await Tech.create(techData)
    return NextResponse.json({ newTech })

  } catch (e) {
    console.error('Error creating tech:', e)
    console.error('Validation errors:', e.errors)
    return NextResponse.json({ 
      error: e.message,
      details: e.errors 
    }, { status: 500 })
  }
}
  




