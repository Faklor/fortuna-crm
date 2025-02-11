import dbConnet from "@/lib/db"
import Requisition from '@/models/requisition'
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
    await dbConnet()

    try {
        const { id } = params
        
        if (!id) {
            return NextResponse.json(
                { error: 'ID не указан' },
                { status: 400 }
            )
        }

        const requisition = await Requisition.findById(id)
        
        if (!requisition) {
            return NextResponse.json(
                { error: 'Заявка не найдена' },
                { status: 404 }
            )
        }

        return NextResponse.json(requisition)
    } catch (e) {
        console.error('Error fetching requisition:', e)
        return NextResponse.json(
            { error: e.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
} 