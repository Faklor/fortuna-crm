import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';

export async function GET(request) {
    await dbConnect();
    try {
        // Получаем сезон из URL параметров
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');

        // Формируем запрос
        let query = {};
        if (season) {
            query.season = season;
        }

        // Получаем заметки с фильтром по сезону, если он указан
        const notes = await Notes.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch notes' 
        }, { status: 500 });
    }
}
