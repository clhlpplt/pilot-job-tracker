import axios from 'axios'

export interface JobListing {
  title: string
  company?: string
  location?: string
  aircraftType?: string
  description?: string
  requirements?: string
  salary?: string
  postedDate?: Date
  applicationUrl?: string
  source: string
  sourceUrl: string
}

interface JSearchJob {
  title: string
  company_name: string
  location: string
  description: string
  job_required_experience?: string
  job_employment_type?: string
  job_salary_currency?: string
  job_min_salary?: number
  job_max_salary?: number
  job_apply_link: string
  job_posted_at_datetime_utc: string
}

interface JSearchResponse {
  data: JSearchJob[]
}

export class JobScraper {
  private static readonly RAPIDAPI_HOST = 'jsearch.p.rapidapi.com'
  private static readonly RAPIDAPI_URL = `https://${this.RAPIDAPI_HOST}/search`

  // European countries for filtering
  private static readonly EUROPEAN_COUNTRIES = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
    'Malta', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania',
    'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom'
  ]

  // African countries for filtering
  private static readonly AFRICAN_COUNTRIES = [
    'South Africa', 'Kenya', 'Nigeria', 'Egypt', 'Morocco', 'Tunisia', 'Ghana',
    'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda', 'Botswana', 'Namibia',
    'Zimbabwe', 'Zambia', 'Mozambique', 'Angola', 'Senegal', 'Ivory Coast',
    'Cameroon', 'Algeria', 'Libya', 'Sudan', 'Mauritius', 'Togo'
  ]

  private static async searchJSearch(query: string, countries: string[] = []): Promise<JSearchJob[]> {
    try {
      console.log(`🔍 Searching JSearch API for: "${query}" in countries: ${countries.join(', ')}`)
      
      // Check if RAPIDAPI_KEY is available
      const rapidApiKey = process.env.RAPIDAPI_KEY
      if (!rapidApiKey) {
        console.error('❌ RAPIDAPI_KEY is not defined in environment variables')
        console.error('🔧 Available env vars:', Object.keys(process.env).filter(k => k.includes('RAPID') || k.includes('API')))
        return []
      }
      
      console.log('🔑 RAPIDAPI_KEY found, length:', rapidApiKey.length)

      const params = new URLSearchParams({
        query,
        page: '1',
        num_pages: '1',
        date_posted: 'all',
        remote_jobs_only: 'false',
        employment_types: 'FULLTIME',
        job_requirements: 'no_experience_required'
      })

      // Add country filters if provided
      if (countries.length > 0) {
        params.append('countries', countries.join(','))
      }

      const url = `${this.RAPIDAPI_URL}?${params}`
      console.log('🌐 Request URL:', url)

      const response = await axios.get<JSearchResponse>(url, {
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': this.RAPIDAPI_HOST
        },
        timeout: 15000
      })

      console.log(`📊 JSearch response status: ${response.status}`)
      console.log(`📊 JSearch response for "${query}": Found ${response.data.data.length} jobs`)
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ AxiosError searching JSearch for "${query}":`)
        console.error(`📡 Status: ${error.response?.status || 'No response'}`)
        console.error(`📡 Status Text: ${error.response?.statusText || 'No status text'}`)
        console.error(`📡 Response Data:`, error.response?.data || 'No response data')
        console.error(`📡 Headers:`, error.response?.headers || 'No headers')
        console.error(`📡 Request Config:`, {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        })
      } else {
        console.error(`❌ Error searching JSearch for "${query}":`, error)
      }
      return []
    }
  }

  private static extractAircraftType(text: string): string | null {
    const aircraftPatterns = [
      /(A320|A318|A319|A321|A330|A340|A350|A380|B737|B747|B757|B767|B777|B787|B717|E190|E195|CRJ|ATR|Dash|Q400|Cessna|Piper|Beech|King Air|Cirrus|Embraer|Bombardier|Fokker|Saab|Dornier)/gi,
      /(?:Aircraft|Type|Equipment):\s*([A-Za-z0-9\s-]+)/i,
      /(?:fly|operate|rated on)\s+([A-Za-z0-9\s-]+)/i,
    ]

    for (const pattern of aircraftPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  }

  private static extractLocation(text: string): string | null {
    // Common location patterns
    const locationPatterns = [
      /(?:Location|Base|Based in?):\s*([A-Za-z\s,]+)/i,
      /(?:in|at)\s+([A-Za-z\s,]+(?:\s+(?:USA|UK|Germany|France|Italy|Spain|Netherlands|Poland|Belgium|Austria|Switzerland|Sweden|Norway|Denmark|Finland|Portugal|Ireland|Greece|Czech|Hungary|Romania|Bulgaria|Croatia|Slovakia|Slovenia|Estonia|Latvia|Lithuania|Cyprus|Malta|Luxembourg)))/i,
      /([A-Za-z\s,]+(?:\s+(?:USA|UK|Germany|France|Italy|Spain|Netherlands|Poland|Belgium|Austria|Switzerland|Sweden|Norway|Denmark|Finland|Portugal|Ireland|Greece|Czech|Hungary|Romania|Bulgaria|Croatia|Slovakia|Slovenia|Estonia|Latvia|Lithuania|Cyprus|Malta|Luxembourg)))/i,
    ]

    for (const pattern of locationPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  }

  private static isCPLJob(job: JSearchJob): boolean {
    const cplKeywords = [
      'cpl',
      'commercial pilot',
      'commercial pilot license',
      'first officer',
      'co-pilot',
      'second officer',
      'flight deck',
      'pilot position',
      'airline pilot',
      'commercial aviation',
      'low hour',
      'low-hour',
      'entry level',
      'junior pilot',
      'type rating',
      'tric',
      'multi crew',
      'multi-crew'
    ]

    const fullText = `${job.title} ${job.description} ${job.job_required_experience || ''}`.toLowerCase()
    return cplKeywords.some(keyword => fullText.includes(keyword))
  }

  private static isLowHourFriendly(job: JSearchJob): boolean {
    const lowHourKeywords = [
      'low hour',
      'low-hour',
      'entry level',
      'junior',
      'first officer',
      'cpl required',
      'cpl holders',
      'fresh cpl',
      'type rating provided',
      'rating provided',
      'no experience required',
      'training provided',
      'cadet',
      'ab initio',
      'no experience'
    ]

    const fullText = `${job.title} ${job.description} ${job.job_required_experience || ''}`.toLowerCase()
    return lowHourKeywords.some(keyword => fullText.includes(keyword))
  }

  private static filterByPilotProfile(job: JSearchJob): boolean {
    const fullText = `${job.title} ${job.description} ${job.job_required_experience || ''}`.toLowerCase()
    
    // Skip jobs requiring high hours (more than 500)
    if (fullText.includes('500 hours') || fullText.includes('1000 hours') || fullText.includes('1500 hours') || 
        fullText.includes('2000 hours') || fullText.includes('atpl required') || fullText.includes('3000 hours')) {
      console.log(`⏭️  Skipping high-hour job: ${job.title}`)
      return false
    }

    // Check if it's a CPL job
    if (!this.isCPLJob(job)) {
      console.log(`⏭️  Skipping non-CPL job: ${job.title}`)
      return false
    }

    // Check if low-hour friendly
    if (!this.isLowHourFriendly(job)) {
      console.log(`⏭️  Skipping non-low-hour job: ${job.title}`)
      return false
    }

    return true
  }

  private static convertToJobListing(job: JSearchJob, query: string): JobListing {
    const aircraftType = this.extractAircraftType(job.description)
    const location = this.extractLocation(job.description) || job.location

    return {
      title: job.title,
      company: job.company_name,
      location: location || undefined,
      aircraftType: aircraftType || undefined,
      description: job.description.substring(0, 500),
      requirements: job.job_required_experience,
      salary: job.job_min_salary ? `${job.job_min_salary} ${job.job_salary_currency || ''}` : undefined,
      postedDate: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : undefined,
      applicationUrl: job.job_apply_link,
      source: 'jsearch.p.rapidapi.com',
      sourceUrl: job.job_apply_link
    }
  }

  static async searchAllQueries(): Promise<JobListing[]> {
    console.log('🚀 Starting JSearch API job searching...')
    
    // Debug environment variables
    console.log('🔧 Environment check:')
    console.log('📋 NODE_ENV:', process.env.NODE_ENV)
    console.log('📋 Available env vars:', Object.keys(process.env))
    
    const rapidApiKey = process.env.RAPIDAPI_KEY
    if (!rapidApiKey) {
      console.error('❌ RAPIDAPI_KEY not found in environment variables')
      console.error('🔧 Please add RAPIDAPI_KEY to your environment variables')
      console.error('📋 Expected env vars: RAPIDAPI_KEY, GROQ_API_KEY, DATABASE_URL, etc.')
      return []
    }
    
    console.log('🔑 RAPIDAPI_KEY found, length:', rapidApiKey.length)
    console.log('🔑 RAPIDAPI_KEY starts with:', rapidApiKey.substring(0, 8) + '...')

    // Search queries for different regions and experience levels
    const searchQueries = [
      {
        query: 'pilot CPL Europe',
        countries: this.EUROPEAN_COUNTRIES
      },
      {
        query: 'first officer low hours Europe',
        countries: this.EUROPEAN_COUNTRIES
      },
      {
        query: 'pilot CPL Africa',
        countries: this.AFRICAN_COUNTRIES
      },
      {
        query: 'commercial pilot entry level',
        countries: [...this.EUROPEAN_COUNTRIES, ...this.AFRICAN_COUNTRIES]
      }
    ]

    const allJobs: JobListing[] = []

    for (const searchConfig of searchQueries) {
      console.log(`🔍 Executing search: "${searchConfig.query}"`)
      const jobs = await this.searchJSearch(searchConfig.query, searchConfig.countries)
      
      // Filter jobs based on pilot profile
      const filteredJobs = jobs.filter(job => this.filterByPilotProfile(job))
      
      // Convert to JobListing format
      const convertedJobs = filteredJobs.map(job => this.convertToJobListing(job, searchConfig.query))
      
      console.log(`✅ Search "${searchConfig.query}": ${filteredJobs.length} relevant jobs found`)
      allJobs.push(...convertedJobs)
    }

    // Remove duplicates based on title + company
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex((j) => 
        j.title === job.title && j.company === job.company
      )
    )

    console.log(`🎯 Total unique jobs found: ${uniqueJobs.length}`)
    return uniqueJobs
  }

  // Keep the old method name for compatibility
  static async scrapeAllRSSFeeds(): Promise<JobListing[]> {
    return this.searchAllQueries()
  }
}
