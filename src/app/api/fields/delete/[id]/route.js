import { NextResponse } from 'next/server';
import DBConnect from '@/lib/db';
import Field from '@/models/fields';

export async function DELETE(request, { params: paramsPromise }) {
    await DBConnect();
    try {
        const params = await paramsPromise;
        const { id } = params;
        
        // Удаляем поле
        const result = await Field.findByIdAndDelete(id);
        
        if (!result) {
            return NextResponse.json({ 
                success: false, 
                error: 'Поле не найдено' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Поле успешно удалено' 
        });
    } catch (error) {
        console.error('Error deleting field:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Ошибка при удалении поля' 
        }, { status: 500 });
    }
} 