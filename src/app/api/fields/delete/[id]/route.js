import { NextResponse } from 'next/server';
import DBConnect from '@/lib/db';
import Field from '@/models/fields';
import SubField from '@/models/subField';
import Work from '@/models/works';

export async function DELETE(request, { params: paramsPromise }) {
    await DBConnect();
    try {
        const params = await paramsPromise;
        const { id } = params;
        
        // Удаляем все подполя, связанные с этим полем
        await SubField.deleteMany({ 'properties.parentId': id });
        
        // Удаляем все работы, связанные с этим полем
        await Work.deleteMany({ fieldId: id });
        
        // Удаляем само поле
        const result = await Field.findByIdAndDelete(id);
        
        if (!result) {
            return NextResponse.json({ 
                success: false, 
                error: 'Поле не найдено' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Поле и все связанные данные успешно удалены' 
        });
    } catch (error) {
        console.error('Error deleting field and related data:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Ошибка при удалении поля и связанных данных' 
        }, { status: 500 });
    }
} 