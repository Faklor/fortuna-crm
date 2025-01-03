import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import Order from '@/models/orders'
import Operation from '@/models/operations'
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs/promises'
import path from "path"


export async function POST(req,res) {
  await dbConnet()

    try {
    
      const formData = await req.formData()
      const {  name, category, organization, description, icon } = Object.fromEntries(formData)


      if(icon !== 'null'){
        const file = formData.get('icon')
        
        const uploadPath = path.join(process.cwd(), 'public/imgsObj')
        const fileName = `${name}-${file.name}`
        const filePath= path.join(uploadPath,fileName)

        const byteLength = await file.arrayBuffer()
        const bufferData = await Buffer.from(byteLength)
        
        const newTech = await Tech.create({name:name, catagory:category, organization:organization, description:description, icon:fileName})

        if(newTech){
          fs.writeFile(filePath, bufferData)

          
          return NextResponse.json({newTech})
          //добавить удаление предыдущей icon
        }
        
      }
      else{
        const newTech = await Tech.create({name:name, catagory:category, organization:organization, description:description, icon:'Default.png'})

        if(newTech){
          
          return NextResponse.json({newTech})
        }
      }

    } catch (e) {
     
      return NextResponse.json({ error: e.message })
    }
}
  




