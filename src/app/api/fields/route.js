import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Fields from '@/models/fields'

export async function POST(req) {
    await dbConnect()
    try {
        const { season } = await req.json()
        const fields = await Fields.find({seasons: season})
        return NextResponse.json({ fields })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 })
    }
  
}