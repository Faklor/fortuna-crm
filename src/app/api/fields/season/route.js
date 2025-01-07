import dbConnect from "@/lib/db"
import Season from '@/models/seasons'
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
    await dbConnect();
    
    try {
        const seasons = await Season.find().sort({ name: -1 }); // Сортировка по убыванию
        return NextResponse.json(seasons);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    await dbConnect();
    
    try {
        const data = await req.json();
        const season = new Season(data);
        await season.save();
        
        return NextResponse.json(season);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}