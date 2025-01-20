import { NextResponse } from 'next/server'
import Workers from '@/models/workers'
import dbConnect from '@/lib/db'


export async function POST(req) {
    try {
        await dbConnect()
        const { workerId } = await req.json()
        
        const worker = await Workers.findById(workerId)
        if (!worker) {
            return NextResponse.json(
                { error: 'Worker not found' },
                { status: 404 }
            )
        }
        
        const ktuRecord = worker.calculateKTU()
        await worker.save()
        
        return NextResponse.json(ktuRecord)
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
} 