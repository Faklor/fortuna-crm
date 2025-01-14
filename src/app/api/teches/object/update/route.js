import dbConnet from "@/lib/db"
import Tech from '@/models/tech'
import { NextResponse } from "next/server"

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
  




