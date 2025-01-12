import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';

export async function GET() {
    await dbConnect();
    try {
        const notes = await Notes.find({});
        
        // Преобразуем документы в простые объекты
        const serializedNotes = notes.map(note => {
            const noteObj = note.toObject();
            
            // Если есть изображение, преобразуем его из BSON
            if (noteObj.image?.data) {
                return {
                    ...noteObj,
                    image: {
                        ...noteObj.image,
                        data: noteObj.image.data.buffer 
                            ? Buffer.from(noteObj.image.data.buffer).toString('base64')
                            : Buffer.from(noteObj.image.data).toString('base64'),
                        contentType: noteObj.image.contentType
                    }
                };
            }
            return noteObj;
        });

        return NextResponse.json(serializedNotes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
