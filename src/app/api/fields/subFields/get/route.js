import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubField from '@/models/subField';

export async function GET(req) {
    await dbConnect();
  try {
    //const { fieldId } = await req.json();

    const subFields = await SubField.find({});

    return NextResponse.json({
      success: true,
      subFields
    });
  } catch (error) {
    console.error('Error fetching subfields:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subfields'
    }, { status: 500 });
  }
}