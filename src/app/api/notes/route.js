import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';

export async function GET() {
    await dbConnect();
    try {
        const notes = await Notes.find({})
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
