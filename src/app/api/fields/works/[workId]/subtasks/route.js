import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subtask from '@/models/subtasks';

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const { workId } = params;

        const subtasks = await Subtask.find({ workId })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            subtasks: subtasks || [] // Всегда возвращаем массив
        });
    } catch (error) {
        console.error('Error fetching subtasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subtasks', subtasks: [] },
            { status: 500 }
        );
    }
}


export async function POST(request, { params }) {
    await dbConnect();

    try {
        const { workId } = params;
        const data = await request.json();

        const subtask = new Subtask({
            ...data,
            workId,
            createdAt: new Date()
        });

        await subtask.save();

        return NextResponse.json({
            success: true,
            subtask
        });
    } catch (error) {
        console.error('Error creating subtask:', error);
        return NextResponse.json(
            { error: 'Failed to create subtask' },
            { status: 500 }
        );
    }
} 