import dbConnet from "@/lib/db"
import Parts from "@/models/parts"
import { NextResponse } from "next/server"

export async function POST(req){
    await dbConnet()

    try {
        const { partsArr } = await req.json()

        const findParts = await Parts.find({_id: { $in: partsArr }}).lean() // Используем lean() для получения простых объектов
        
        if (!findParts || findParts.length === 0) {
            return NextResponse.json({ error: 'Parts not found' }, { status: 404 })
        }

        // Создаем новый массив с нужными данными
        const combinedArray = findParts.map(part => {
            const matchingPart = partsArr.find(p => p._id === part._id.toString())
            return {
                _id: part._id.toString(),
                name: part.name,
                manufacturer: part.manufacturer,
                count: part.count || 0,
                catagory: part.catagory,
                contact: part.contact,
                bindingObj: part.bindingObj || [],
                serialNumber: part.serialNumber || '',
                sellNumber: part.sellNumber || '',
                sum: part.sum || 0,
                countReq: matchingPart ? matchingPart.countReq : 0,
                description: matchingPart ? matchingPart.description : 'шт.'
            }
        })

        return NextResponse.json(combinedArray)
    }
    catch(e) {
        console.error('Error in optionParts:', e)
        return NextResponse.json(
            { error: e.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}