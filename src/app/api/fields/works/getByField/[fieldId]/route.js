import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';

export async function GET(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
        const { fieldId } = params;

        const works = await Work.find({ fieldId })
            .sort({ plannedDate: 1 })
            .exec();

        return NextResponse.json(works);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
} 