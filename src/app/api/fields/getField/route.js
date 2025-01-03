import Field from '@/models/fields'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'

export async function POST(req) {
    await dbConnect()

    try {
        const {_id} = await req.json()
        const field = await Field.findOne({_id:_id})

        return NextResponse.json(field)
    } catch (error) {
        return NextResponse.json({error:error.message}, {status:500})
    }
}