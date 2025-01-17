import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
    await dbConnect();
    try {
        const { noteId } = await request.json();

        const note = await Notes.findById(noteId);
        
        if (!note) {
            return NextResponse.json({ 
                success: false, 
                error: 'Note not found' 
            }, { status: 404 });
        }

        // Удаляем файл изображения, если он существует и это не Default.png
        if (note.icon?.fileName && note.icon.fileName !== 'Default.png') {
            try {
                const filePath = path.join(process.cwd(), 'uploads', 'imgsNotes', note.icon.fileName);
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Error deleting image file:', error);
                // Продолжаем удаление заметки даже если не удалось удалить файл
            }
        }

        // Удаляем заметку из БД
        await Notes.findByIdAndDelete(noteId);

        return NextResponse.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to delete note' 
        }, { status: 500 });
    }
}
