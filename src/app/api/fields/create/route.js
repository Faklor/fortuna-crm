import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Fields from '@/models/fields';
import mongoose from 'mongoose';

export async function POST(request) {
    await dbConnect();

    try {
        const { name, coordinates, season } = await request.json();

        if (!coordinates || coordinates.length === 0) {
            return NextResponse.json(
                { error: 'No valid coordinates provided' }, 
                { status: 400 }
            );
        }

        // Создаем документ с теми же свойствами, что и у загруженных полей
        const fieldDocument = {
            _id: new mongoose.Types.ObjectId(),
            geometryType: 'Polygon',
            coordinates: [coordinates],
            properties: {
                Name: name || '',
                descriptio: '',
                timestamp: '',
                begin: '',
                end: '',
                altitudeMo: '',
                tessellate: -1,
                extrude: 0,
                visibility: -1,
                drawOrder: null,
                icon: ''
            },
            createdAt: new Date(),
            seasons: [season || new Date().getFullYear().toString()],
            __v: 0
        };

        // Сохраняем поле в базу данных
        const createField = await Fields.create(fieldDocument);
        
        if (!createField) {
            throw new Error('Failed to create field');
        }

        return NextResponse.json({ 
            success: true,
            field: createField 
        });

    } catch (error) {
        console.error('Error creating field:', error);
        return NextResponse.json(
            { error: 'Failed to create field' },
            { status: 500 }
        );
    }
} 