import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Work from '@/models/works'

export async function PUT(request, { params }) {
    await dbConnect()

    try {
        const { workId } = params
        const updateData = await request.json()

        // Проверяем, изменился ли статус на 'completed'
        if (updateData.status === 'completed' && !updateData.completedDate) {
            updateData.completedDate = new Date()
        }

        // Находим и обновляем работу
        const updatedWork = await Work.findByIdAndUpdate(
            workId,
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        )

        if (!updatedWork) {
            return NextResponse.json(
                { error: 'Work not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            work: updatedWork
        })

    } catch (error) {
        console.error('Error updating work:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
} 