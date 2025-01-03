import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import SubField from '@/models/subField'

export async function POST(req) {
    await dbConnect()

    try {
        const { _id, coordinates, properties } = await req.json()

        const updateData = {};
        if (coordinates) updateData.coordinates = coordinates;
        if (properties) updateData.properties = properties;

        const updatedSubField = await SubField.findByIdAndUpdate(
            _id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedSubField) {
            return NextResponse.json(
                { error: 'Subfield not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: updatedSubField })
    } catch (error) {
        console.error('Error updating subfield:', error)
        return NextResponse.json(
            { error: 'Failed to update subfield' },
            { status: 500 }
        )
    }
}