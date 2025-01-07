import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubField from '@/models/subField';
import Field from '@/models/fields';

export async function GET(request) {
    await dbConnect();
    
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');

        if (season) {
            // Получаем поля для этого сезона
            const fields = await Field.find({ seasons: season });
            const fieldIds = fields.map(field => field._id.toString());
            

            // Получаем подполя для этих полей
            const subFields = await SubField.find({
                'properties.parentId': { $in: fieldIds }
            });

            return NextResponse.json({
                success: true,
                subFields: subFields
            });
        } else {
            // Если сезон не указан, возвращаем все подполя
            const subFields = await SubField.find({});
            return NextResponse.json({
                success: true,
                subFields: subFields
            });
        }

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}