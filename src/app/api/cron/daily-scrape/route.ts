import { NextRequest, NextResponse } from 'next/server'
import { JobScraper } from '@/lib/scrapers'
import { JobScorer, UserProfile } from '@/lib/ai-scoring'
import { EmailService } from '@/lib/email-service'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if database is available
    if (!prisma) {
      return NextResponse.json({ 
        error: 'Database not available',
        message: 'DATABASE_URL not configured'
      }, { status: 500 })
    }

    console.log('Starting daily job scraping process...')

    // Get or create user profile
    let userProfile = await prisma.userProfile.findFirst({
      include: {
        jobs: true,
        emailDigests: true
      }
    })

    if (!userProfile) {
      // Create default profile based on user's specifications
      userProfile = await prisma.userProfile.create({
        data: {
          email: process.env.USER_EMAIL || 'user@example.com',
          name: 'Pilot',
          totalHours: 140,
          picHours: 75,
          ratings: ['CPL', 'MEP', 'IR', 'SEP'],
          languages: {
            english: 'C1',
            italian: 'native',
            french: 'native',
            spanish: 'A2',
            german: 'A2'
          },
          baseLocation: 'Europe',
          targetRegions: ['Europe', 'Africa'],
          openToAllTypes: true,
          jobTypes: ['airlines', 'charter', 'cargo', 'air_ambulance', 'flight_instruction', 'ferry_flights']
        },
        include: {
          jobs: true,
          emailDigests: true
        }
      })
    }

    // Scrape all job sources
    console.log('Scraping job sources...')
    const scrapedJobs = await JobScraper.scrapeAllSources()
    console.log(`Found ${scrapedJobs.length} job listings`)

    // Filter out existing jobs
    const existingSourceUrls = new Set(userProfile.jobs.map((job: any) => job.sourceUrl))
    const newJobs = scrapedJobs.filter((job: any) => !existingSourceUrls.has(job.sourceUrl))
    console.log(`${newJobs.length} new jobs found`)

    if (newJobs.length === 0) {
      console.log('No new jobs found. Skipping email digest.')
      return NextResponse.json({ 
        message: 'No new jobs found',
        totalScraped: scrapedJobs.length,
        existingJobs: existingSourceUrls.size
      })
    }

    // Score new jobs
    console.log('Scoring new jobs with AI...')
    const profile: UserProfile = {
      totalHours: userProfile.totalHours,
      picHours: userProfile.picHours,
      ratings: userProfile.ratings,
      languages: userProfile.languages as Record<string, string>,
      baseLocation: userProfile.baseLocation,
      targetRegions: userProfile.targetRegions,
      openToAllTypes: userProfile.openToAllTypes,
      jobTypes: userProfile.jobTypes
    }

    const scoredJobs = await JobScorer.batchScoreJobs(newJobs, profile)
    console.log('Job scoring completed')

    // Save new jobs to database
    console.log('Saving jobs to database...')
    const savedJobs = await prisma.jobListing.createMany({
      data: scoredJobs.map(({ job, score }: { job: any; score: any }) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        aircraftType: job.aircraftType,
        description: job.description,
        requirements: job.requirements,
        salary: job.salary,
        postedDate: job.postedDate,
        applicationUrl: job.applicationUrl,
        source: job.source,
        sourceUrl: job.sourceUrl,
        matchScore: score.score,
        matchCategory: score.category,
        aiNotes: score.notes,
        userProfileId: userProfile.id,
        isProcessed: true
      }))
    })

    // Prepare email digest data
    const perfectMatches = scoredJobs.filter((j: any) => j.score.category === 'PERFECT_MATCH')
    const priorityJobs = scoredJobs.filter((j: any) => j.score.category === 'PRIORITY')
    const notSuitable = scoredJobs.filter((j: any) => j.score.category === 'NOT_SUITABLE')

    const emailData = {
      totalJobs: scrapedJobs.length,
      newJobs: newJobs.length,
      perfectMatches: perfectMatches.length,
      priorityJobs: priorityJobs.length,
      notSuitable: notSuitable.length,
      jobs: scoredJobs
    }

    // Send daily digest email
    console.log('Sending daily digest email...')
    await EmailService.sendDailyDigest(userProfile.email, emailData)

    // Save email digest record
    await prisma.emailDigest.create({
      data: {
        totalJobs: scrapedJobs.length,
        newJobs: newJobs.length,
        perfectMatches: perfectMatches.length,
        priorityJobs: priorityJobs.length,
        notSuitable: notSuitable.length,
        summary: `Found ${newJobs.length} new jobs: ${perfectMatches.length} perfect matches, ${priorityJobs.length} priority jobs`,
        userProfileId: userProfile.id
      }
    })

    console.log('Daily scrape process completed successfully')

    return NextResponse.json({
      message: 'Daily scrape completed successfully',
      stats: {
        totalScraped: scrapedJobs.length,
        newJobs: newJobs.length,
        perfectMatches: perfectMatches.length,
        priorityJobs: priorityJobs.length,
        notSuitable: notSuitable.length,
        emailSent: true
      }
    })

  } catch (error) {
    console.error('Error in daily scrape:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
