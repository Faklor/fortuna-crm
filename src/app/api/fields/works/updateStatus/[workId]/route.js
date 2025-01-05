import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';

export async function PATCH(request, { params }) {
    await dbConnect();

    try {
        const { workId } = params;
        const { status } = await request.json();

        const work = await Work.findByIdAndUpdate(
            workId,
            { status },
            { new: true }
        );

        return NextResponse.json(work);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
} 