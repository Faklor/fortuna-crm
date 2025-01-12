import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';

export async function POST(request) {
    await dbConnect();
    try {
        const formData = await request.formData();
        
        const title = formData.get('title');
        const description = formData.get('description');
        const coordinates = JSON.parse(formData.get('coordinates'));
        const image = formData.get('image');
        const season = formData.get('season') || new Date().getFullYear().toString();

        if (!title || !description || !coordinates) {
            return NextResponse.json({ 
                success: false,
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        const noteData = {
            title,
            description,
            coordinates,
            season
        };

        if (image && image.size > 0) {
            const byteLength = await image.arrayBuffer();
            const buffer = Buffer.from(byteLength);
            
            noteData.image = {
                data: buffer,
                contentType: image.type,
                fileName: image.name
            };
        }

        const newNote = await Notes.create(noteData);

        return NextResponse.json({
            success: true,
            message: 'Note added successfully',
            note: newNote
        });
    } catch (error) {
        console.error('Detailed error:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to add note'
        }, { status: 500 });
    }
}
