import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subtask from '@/models/subtasks';

export async function GET(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
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

export async function POST(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
        const { workId } = params;
        const data = await request.json();
        
        // Сохраняем полные данные в БД
        const subtaskData = {
            ...data,
            workId,
            plannedDate: new Date(data.plannedDate),
            // Сохраняем полные объекты работников и техники
            workers: data.workers, // Теперь тут полные объекты
            equipment: data.equipment, // Теперь тут полные объекты
            tracks: data.tracks || [],
            createdAt: new Date()
        };

        const subtask = new Subtask(subtaskData);
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