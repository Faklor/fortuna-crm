import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Fields from '@/models/fields'

export async function GET() {
    await dbConnect()
    try {
        
        const fields = await Fields.find({})
        .select('properties.seasons coordinates geometryType') // Выбираем только нужные поля
        .lean() // Преобразуем в простой JavaScript объект для лучшей производительности
    
        if (!fields || fields.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No fields found',
                fields: []
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Fields fetched successfully',
            fields: fields,
            totalCount: fields.length
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 })
    }
  
}