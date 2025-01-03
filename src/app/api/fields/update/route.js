import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Field from '@/models/fields'


export async function POST(req) {
    await dbConnect()

    try {
        const { _id, coordinates, geometryType, properties } = await req.json()

        const updateData = {};
        if (coordinates) updateData.coordinates = coordinates;
        if (geometryType) updateData.geometryType = geometryType;
        if (properties) updateData.properties = properties;

        const updatedField = await Field.findByIdAndUpdate(
            _id,
            { $set: updateData },
            { new: true }
        )

        if (!updatedField) {
            return NextResponse.json(
                { error: 'Field not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ 
            success: true, 
            data: updatedField 
        })
    } catch (error) {
        console.error('Error updating field:', error)
        return NextResponse.json(
            { error: 'Failed to update field' },
            { status: 500 }
        )
    }
}
