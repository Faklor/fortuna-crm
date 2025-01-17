import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise
  const { filename } = params
  
  try {
    const filePath = path.join(process.cwd(), 'uploads', 'imgsObjects', filename)
    const file = await fs.readFile(filePath)
    
    const ext = path.extname(filename).toLowerCase()
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }[ext] || 'application/octet-stream'
    
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
    
    return new NextResponse(file, { headers })
  } catch (error) {
    console.error('Error loading image:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
} 