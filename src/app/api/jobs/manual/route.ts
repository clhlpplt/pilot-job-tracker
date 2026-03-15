import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!prisma) {
      return NextResponse.json({ 
        error: 'Database not available',
        message: 'DATABASE_URL not configured'
      }, { status: 500 })
    }

    const body = await request.json()
    const { 
      title, 
      company, 
      location, 
      aircraftType, 
      description, 
      requirements, 
      applicationUrl, 
      source = 'manual' 
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create manual job entry
    const job = await prisma.jobListing.create({
      data: {
        title,
        company,
        location,
        aircraftType,
        description,
        requirements,
        applicationUrl,
        source,
        sourceUrl: applicationUrl || '',
        score: 50, // Default score for manual entries
        category: 'PRIORITY', // Default category for manual entries
        notes: 'Manually added job',
        status: 'new'
      }
    })

    console.log(`✅ Manual job added: ${title}`)

    return NextResponse.json({ 
      success: true,
      job 
    })

  } catch (error) {
    console.error('Error adding manual job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
