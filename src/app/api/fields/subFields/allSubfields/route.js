import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubField from '@/models/subField';

export async function GET() {
    await dbConnect();
    
    try {
       
        const subFields = await SubField.find({});

        return NextResponse.json({
            subFields: subFields
        })
        

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}