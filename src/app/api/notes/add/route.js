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
        
        const savedNote = await Notes.findById(newNote._id);
        const serializedNote = savedNote.toObject();

        if (serializedNote.image?.data) {
            const base64Data = Buffer.from(serializedNote.image.data).toString('base64');
            serializedNote.image = {
                ...serializedNote.image,
                data: base64Data
            };
        }

        const allNotes = await Notes.find({});
        const serializedNotes = allNotes.map(note => {
            const noteObj = note.toObject();
            if (noteObj.image?.data?.$binary) {
                return {
                    ...noteObj,
                    image: {
                        ...noteObj.image,
                        data: noteObj.image.data.$binary.base64,
                        contentType: noteObj.image.contentType
                    }
                };
            }
            return noteObj;
        });

        return NextResponse.json({
            success: true,
            message: 'Note added successfully',
            note: serializedNote,
            allNotes: serializedNotes
        });
    } catch (error) {
        console.error('Detailed error:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to add note'
        }, { status: 500 });
    }
}
