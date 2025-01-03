import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import SubField from '@/models/subField'
import mongoose from 'mongoose'

export async function POST(req) {
    await dbConnect()

    try {
        const { parentId, coordinates, properties } = await req.json()

        const subField = new SubField({
            _id: new mongoose.Types.ObjectId(), // Добавляем _id
            geometryType: 'Polygon',
            coordinates: coordinates,
            properties: {
                ...properties,
                isSubField: true,
                parentId: parentId
            },
            seasons: [], // Добавьте нужные сезоны
            createdAt: new Date()
        })

        await subField.save()

        return NextResponse.json({ success: true, data: subField })
    } catch (error) {
        console.error('Error creating subfield:', error)
        return NextResponse.json(
            { error: 'Failed to create subfield' },
            { status: 500 }
        )
    }
}