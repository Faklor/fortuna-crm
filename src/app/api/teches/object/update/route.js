import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextResponse } from "next/server"

export async function POST(req, res) {
    await dbConnet()

    try {
        const formData = await req.formData()
        const { _id, name, category, organization, description } = Object.fromEntries(formData)
        const imgTitle = formData.get('imgTitle')

        const updateData = {
            name,
            catagory: category,
            organization,
            description
        }

        if (imgTitle && imgTitle !== 'null') {
            const byteLength = await imgTitle.arrayBuffer()
            const bufferData = Buffer.from(byteLength)
            
            updateData.icon = {
                data: bufferData,
                contentType: imgTitle.type,
                fileName: imgTitle.name
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
  




