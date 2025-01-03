import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Fields from '@/models/fields'

export async function POST(request) {
  await dbConnect()

  try {
    const { season, features } = await request.json()
   
    const validFeatures = features.filter(feature => 
      feature?.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0
    )

    if (validFeatures.length === 0) {
      return Response.json({ error: 'No valid geometries found in shapefile' }, { status: 400 })
    }

    const documents = validFeatures.map(feature => ({
      geometryType: feature.geometry.type,
      coordinates: feature.geometry.coordinates,
      properties: feature.properties || {},
      createdAt: new Date(),
      seasons: [season]
    }))


    const createField = await Fields.insertMany(documents)
    if(!createField) throw new Error('Failed to create fields')
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process shapefile' },
      { status: 500 }
    )
  }
} 