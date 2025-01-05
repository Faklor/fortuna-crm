import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notes from '@/models/notes';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
    await dbConnect();
    try {
        const { noteId } = await request.json();

        // Находим заметку перед удалением, чтобы получить путь к изображению
        const note = await Notes.findById(noteId);
        
        if (!note) {
            return NextResponse.json({ 
                success: false, 
                error: 'Note not found' 
            }, { status: 404 });
        }

        // Если есть изображение, удаляем его
        if (note.image) {
            try {
                const imagePath = path.join(process.cwd(), 'public', note.image);
                await unlink(imagePath);
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
