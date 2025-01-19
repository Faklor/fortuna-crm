import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Workers from '@/models/workers'

// Удаление работника
export async function DELETE(request, { params }) {
    try {
        await dbConnect()
        const { id } = params
        const worker = await Workers.findByIdAndDelete(id)
        
        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Обновление данных работника
export async function PUT(request, { params }) {
    try {
        await dbConnect()
        const { id } = params
        const data = await request.json()

        const worker = await Workers.findByIdAndUpdate(
            id,
            {
                name: data.name,
                position: data.position,
                organization: data.organization,
                phone: data.phone,
                email: data.email
            },
            { new: true, runValidators: true }
        )

        if (!worker) {
            return NextResponse.json(
                { error: 'Worker not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(worker)
    } catch (error) {
        console.error('Error updating worker:', error)
        return NextResponse.json(
            { error: 'Failed to update worker' },
            { status: 500 }
        )
    }
} 