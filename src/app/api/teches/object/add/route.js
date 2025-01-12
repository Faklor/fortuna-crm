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
    const { name, category, organization, description } = Object.fromEntries(formData)
    const icon = formData.get('icon')

    if (icon && icon !== 'null') {
      const byteLength = await icon.arrayBuffer()
      const bufferData = Buffer.from(byteLength)
      
      const newTech = await Tech.create({
        name,
        catagory: category,
        organization,
        description,
        icon: {
          data: bufferData,
          contentType: icon.type,
          fileName: icon.name
        }
      })

      return NextResponse.json({ newTech })
    } else {
      const newTech = await Tech.create({
        name,
        catagory: category,
        organization,
        description,
        icon: null
      })

      return NextResponse.json({ newTech })
    }
  } catch (e) {
    console.error('Error creating tech:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
  




