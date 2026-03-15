import Groq from 'groq-sdk'
import { JobListing } from './scrapers'

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null

export interface UserProfile {
  totalHours: number
  picHours: number
  ratings: string[]
  languages: Record<string, string>
  baseLocation: string
  targetRegions: string[]
  openToAllTypes: boolean
  jobTypes: string[]
}

export interface JobScore {
  score: number
  category: 'PERFECT_MATCH' | 'PRIORITY' | 'NOT_SUITABLE'
  notes: string
}

export class JobScorer {
  private static readonly MAX_HOURS_THRESHOLD = 500

  static async scoreJob(job: JobListing, profile: UserProfile): Promise<JobScore> {
    if (!groq) {
      // Fallback scoring when Groq is not available
      if (this.requiresMoreThan500Hours(job)) {
        return {
          score: 0,
          category: 'NOT_SUITABLE',
          notes: 'Job likely requires more experience than your current 140 hours.'
        }
      }

      if (this.isPerfectMatch(job)) {
        return {
          score: 85,
          category: 'PERFECT_MATCH',
          notes: 'Appears to be suitable for low-hour CPL pilots.'
        }
      }

      return {
        score: 60,
        category: 'PRIORITY',
        notes: 'Job may be suitable based on title and requirements.'
      }
    }

    const prompt = `You are an expert aviation career advisor. Evaluate this pilot job listing against the candidate's profile:

CANDIDATE PROFILE:
- Total Flight Hours: ${profile.totalHours}
- PIC Hours: ${profile.picHours}
- Ratings: ${profile.ratings.join(', ')}
- Languages: ${JSON.stringify(profile.languages)}
- Base Location: ${profile.baseLocation}
- Target Regions: ${profile.targetRegions.join(', ')}
- Open to all commercial opportunities: ${profile.openToAllTypes}
- Preferred Job Types: ${profile.jobTypes.join(', ')}

JOB LISTING:
- Title: ${job.title}
- Company: ${job.company || 'Not specified'}
- Location: ${job.location || 'Not specified'}
- Aircraft Type: ${job.aircraftType || 'Not specified'}
- Description: ${job.description || 'Not specified'}
- Requirements: ${job.requirements || 'Not specified'}

EVALUATION CRITERIA:
1. If the job requires more than 500 hours total flight time, mark as "NOT_SUITABLE"
2. If the job specifically mentions CPL with low hours as acceptable, mark as "PERFECT_MATCH"
3. If the job is in Europe or Africa, mark as "PRIORITY"
4. Consider aircraft type compatibility (MEP, SEP ratings)
5. Consider language requirements
6. Consider job type preferences

Respond with a JSON object containing:
{
  "score": 0-100,
  "category": "PERFECT_MATCH" | "PRIORITY" | "NOT_SUITABLE",
  "notes": "Brief explanation of why this job is or isn't a good fit"
}`

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert aviation career advisor. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from Groq')
      }

      const result = JSON.parse(content)
      
      // Apply hard rules
      if (this.requiresMoreThan500Hours(job)) {
        return {
          score: 0,
          category: 'NOT_SUITABLE',
          notes: 'This job requires more than 500 hours flight time, which exceeds your current 140 hours.'
        }
      }

      if (this.isPerfectMatch(job)) {
        return {
          score: 95,
          category: 'PERFECT_MATCH',
          notes: result.notes || 'Perfect match for low-hour CPL pilot.'
        }
      }

      if (this.isPriorityLocation(job, profile)) {
        return {
          score: Math.max(result.score, 70),
          category: 'PRIORITY',
          notes: result.notes || 'Priority location in your target regions.'
        }
      }

      return {
        score: result.score || 50,
        category: result.category || 'PRIORITY',
        notes: result.notes || 'Job evaluated based on your profile.'
      }

    } catch (error) {
      console.error('Error scoring job:', error)
      
      // Fallback scoring
      if (this.requiresMoreThan500Hours(job)) {
        return {
          score: 0,
          category: 'NOT_SUITABLE',
          notes: 'Job likely requires more experience than your current 140 hours.'
        }
      }

      if (this.isPerfectMatch(job)) {
        return {
          score: 85,
          category: 'PERFECT_MATCH',
          notes: 'Appears to be suitable for low-hour CPL pilots.'
        }
      }

      return {
        score: 60,
        category: 'PRIORITY',
        notes: 'Job may be suitable based on title and requirements.'
      }
    }
  }

  private static requiresMoreThan500Hours(job: JobListing): boolean {
    const text = `${job.title} ${job.description} ${job.requirements}`.toLowerCase()
    
    // Look for hour requirements
    const hourPatterns = [
      /(\d+)\s*hours?.*required/i,
      /minimum.*(\d+)\s*hours?/i,
      /(\d+)\s*hours?.*total/i,
      /at least.*(\d+)\s*hours?/i
    ]

    for (const pattern of hourPatterns) {
      const match = text.match(pattern)
      if (match && parseInt(match[1]) > 500) {
        return true
      }
    }

    // Look for keywords that suggest high hour requirements
    const highHourKeywords = [
      'captain',
      'first officer required',
      'type rating required',
      'jet experience',
      'turbofan',
      'airline transport pilot'
    ]

    return highHourKeywords.some(keyword => text.includes(keyword))
  }

  private static isPerfectMatch(job: JobListing): boolean {
    const text = `${job.title} ${job.description} ${job.requirements}`.toLowerCase()
    
    const perfectMatchKeywords = [
      'low hour',
      'low-hour',
      'cpl',
      'commercial pilot license',
      'fresh cpl',
      'entry level',
      'first pilot job',
      'hour building',
      'inexperienced',
      'junior first officer'
    ]

    return perfectMatchKeywords.some(keyword => text.includes(keyword))
  }

  private static isPriorityLocation(job: JobListing, profile: UserProfile): boolean {
    if (!job.location) return false
    
    const location = job.location.toLowerCase()
    const priorityRegions = profile.targetRegions.map(r => r.toLowerCase())
    
    // Check for European countries
    const europeanCountries = [
      'uk', 'united kingdom', 'germany', 'france', 'italy', 'spain', 'netherlands',
      'belgium', 'austria', 'switzerland', 'sweden', 'norway', 'denmark', 'finland',
      'poland', 'czech republic', 'hungary', 'romania', 'bulgaria', 'greece',
      'portugal', 'ireland', 'luxembourg', 'slovakia', 'slovenia', 'estonia',
      'latvia', 'lithuania', 'malta', 'cyprus', 'croatia'
    ]
    
    // Check for African countries
    const africanCountries = [
      'south africa', 'kenya', 'nigeria', 'egypt', 'morocco', 'ghana', 'tanzania',
      'algeria', 'sudan', 'ethiopia', 'uganda', 'mozambique', 'angola', 'zambia',
      'zimbabwe', 'botswana', 'namibia', 'tunisia', 'libya', 'cameroon'
    ]
    
    const isEurope = europeanCountries.some(country => location.includes(country))
    const isAfrica = africanCountries.some(country => location.includes(country))
    
    return isEurope || isAfrica
  }

  static async batchScoreJobs(jobs: JobListing[], profile: UserProfile): Promise<Array<{ job: JobListing; score: JobScore }>> {
    const results = []
    
    // Process jobs in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (job) => {
        const score = await this.scoreJob(job, profile)
        return { job, score }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}
