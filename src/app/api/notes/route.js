import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';

export async function GET(request) {
    await dbConnect();
    
    try {
        // Получаем сезон из URL
        const url = new URL(request.url);
        const referer = request.headers.get('referer') || '';
        const refererUrl = new URL(referer);
        const season = refererUrl.searchParams.get('season') || url.searchParams.get('season');

        // Используем сезон для фильтрации
        const query = season ? { season } : {};
        const notes = await Notes.find(query);

        return NextResponse.json({
            success: true,
            notes: notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
}
