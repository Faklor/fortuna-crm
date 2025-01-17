import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';
import fs from 'fs/promises';
import path from 'path';

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

        const newNote = await Notes.create(noteData);

        if (image && image.size > 0) {
            const byteLength = await image.arrayBuffer();
            const buffer = Buffer.from(byteLength);
            
            const uploadsDir = path.join(process.cwd(), 'uploads', 'imgsNotes');
            await fs.mkdir(uploadsDir, { recursive: true });
            
            const fileExtension = image.name.split('.').pop().toLowerCase();
            const fileName = `${newNote._id}.${fileExtension}`;
            const filePath = path.join(uploadsDir, fileName);
            
            await fs.writeFile(filePath, buffer);
            
            await Notes.findByIdAndUpdate(newNote._id, {
                icon: {
                    fileName: fileName,
                    contentType: image.type
                }
            });
        }

        const allNotes = await Notes.find({ season });

        return NextResponse.json({
            success: true,
            message: 'Note added successfully',
            note: newNote,
            allNotes: allNotes
        });
    } catch (error) {
        console.error('Detailed error:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to add note'
        }, { status: 500 });
    }
}
