import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

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
            console.error('Missing required fields:', { title, description, coordinates });
            return NextResponse.json({ 
                success: false,
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        let imagePath = null;

        if (image && image.size > 0) {
            try {
                const bytes = await image.arrayBuffer();
                const buffer = Buffer.from(bytes);
                
                const notesDir = path.join(process.cwd(), 'public', 'notes');
                await mkdir(notesDir, { recursive: true });
                
                const fileName = `note-${Date.now()}-${image.name}`;
                const fullPath = path.join(notesDir, fileName);
                
                await writeFile(fullPath, buffer);
                imagePath = `/notes/${fileName}`;
            } catch (imageError) {
                console.error('Error saving image:', imageError);
            }
        }

        const noteData = {
            title,
            description,
            coordinates,
            season,
            ...(imagePath && { image: imagePath })
        };

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
            error: error.message || 'Failed to add note',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
