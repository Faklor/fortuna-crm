import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import Order from '@/models/orders'
import Operation from '@/models/operations'
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs/promises'
import path from "path"

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req,res) {
  await dbConnet()

    try {
    
      const formData = await req.formData()
      const { _id, name, category, organization, description, imgTitle } = Object.fromEntries(formData)
      // const file = formData.get('imgTitle')
      // const uploadPath = path.join(process.cwd(), 'src/test')
      // const filePath= path.join(uploadPath,file.name)
      

      // const byteLength = await file.arrayBuffer()
      // const bufferData = await Buffer.from(byteLength)
      
      
      //fs.writeFile(filePath, bufferData)
      if(imgTitle !== 'null'){
        const findObj = await Tech.findOne({_id:_id})
        if(findObj){
          if(findObj.icon !== 'Default.png'){
            fs.unlink(path.join(process.cwd(), `public/imgsObj/${findObj.icon}`))
          }
          
        }

        const file = formData.get('imgTitle')
        const uploadPath = path.join(process.cwd(), 'public/imgsObj')
        const fileName = `${_id}.${file.type.split('/')[1]}`
        const filePath= path.join(uploadPath,fileName)

        const byteLength = await file.arrayBuffer()
        const bufferData = await Buffer.from(byteLength)
        
        const updateTech = await Tech.findOneAndUpdate({_id:_id},{$set:{name:name,icon:fileName,catagory:category,organization:organization,description:description}})
        

        if(updateTech){
          fs.writeFile(filePath, bufferData)

          const newTech = await Tech.findOne({_id:_id})
          return NextResponse.json({newTech})
          //добавить удаление предыдущей icon
        }
        


      }
      else{
        const updateTech = await Tech.findOneAndUpdate({_id:_id},{$set:{name:name,catagory:category,organization:organization,description:description}})
        //console.log(_id, name, category, organization, description, typeof(imgTitle))
        
  
        if(updateTech){
          const newTech = await Tech.findOne({_id:_id})
          return NextResponse.json({newTech})
        }
      }


      

      

    } catch (e) {
     
      return NextResponse.json({ error: e.message })
    }
}
  




