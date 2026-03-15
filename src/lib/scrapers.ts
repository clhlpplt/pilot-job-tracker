import axios from 'axios'
import * as cheerio from 'cheerio'

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

export class JobScraper {
  private static async fetchRSS(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0; +https://pilot-job-tracker.vercel.app)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching RSS from ${url}:`, error)
      return ''
    }
  }

  private static parseXMLContent(xmlContent: string): any {
    try {
      const $ = cheerio.load(xmlContent, { xmlMode: true })
      return $
    } catch (error) {
      console.error('Error parsing XML:', error)
      return null
    }
  }

  private static extractTextFromHTML(html: string): string {
    const $ = cheerio.load(html)
    return $.text().trim()
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

    // Check for common aviation hubs
    const hubs = ['London', 'Paris', 'Frankfurt', 'Amsterdam', 'Madrid', 'Rome', 'Dublin', 'Vienna', 'Brussels', 'Warsaw', 'Prague', 'Budapest', 'Bucharest', 'Athens', 'Lisbon', 'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki', 'Berlin', 'Munich', 'Manchester', 'Birmingham', 'Gatwick', 'Heathrow', 'Schiphol', 'Charles de Gaulle', 'Fiumicino', 'Barajas', 'Malpensa', 'Tegel', 'Zurich', 'Geneva']
    
    for (const hub of hubs) {
      if (text.toLowerCase().includes(hub.toLowerCase())) {
        return hub
      }
    }

    return null
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

  private static isCPLJob(text: string): boolean {
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

    const lowerText = text.toLowerCase()
    return cplKeywords.some(keyword => lowerText.includes(keyword))
  }

  private static isLowHourFriendly(text: string): boolean {
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
      'ab initio'
    ]

    const lowerText = text.toLowerCase()
    return lowHourKeywords.some(keyword => lowerText.includes(keyword))
  }

  static async scrapePilotCareerCentreRSS(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const xmlContent = await this.fetchRSS('https://pilotcareercentre.com/rss')
      const $ = this.parseXMLContent(xmlContent)
      
      if (!$) return jobs

      $('item').each((index: number, element: any) => {
        const $item = $(element)
        const title = $item.find('title').text().trim()
        const description = $item.find('description').text().trim()
        const link = $item.find('link').text().trim()
        const pubDate = $item.find('pubDate').text().trim()
        
        if (!title || !link) return
        
        // Only include CPL-related jobs
        const fullText = `${title} ${description}`.toLowerCase()
        if (!this.isCPLJob(fullText)) return
        
        // Skip jobs requiring high hours
        if (fullText.includes('500 hours') || fullText.includes('1000 hours') || fullText.includes('1500 hours') || fullText.includes('atpl')) {
          return
        }

        const cleanDescription = this.extractTextFromHTML(description)
        const location = this.extractLocation(cleanDescription)
        const aircraftType = this.extractAircraftType(cleanDescription)

        jobs.push({
          title,
          description: cleanDescription.substring(0, 500),
          location: location || undefined,
          aircraftType: aircraftType || undefined,
          postedDate: pubDate ? new Date(pubDate) : undefined,
          applicationUrl: link,
          source: 'pilotcareercentre.com',
          sourceUrl: link
        })
      })
    } catch (error) {
      console.error('Error scraping PilotCareerCentre RSS:', error)
    }
    return jobs
  }

  static async scrapeAviationJobSearchRSS(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const xmlContent = await this.fetchRSS('https://aviationjobsearch.com/rss')
      const $ = this.parseXMLContent(xmlContent)
      
      if (!$) return jobs

      $('item').each((index: number, element: any) => {
        const $item = $(element)
        const title = $item.find('title').text().trim()
        const description = $item.find('description').text().trim()
        const link = $item.find('link').text().trim()
        const pubDate = $item.find('pubDate').text().trim()
        
        if (!title || !link) return
        
        // Only include pilot jobs
        const fullText = `${title} ${description}`.toLowerCase()
        if (!fullText.includes('pilot') && !this.isCPLJob(fullText)) return
        
        // Skip high hour requirements
        if (fullText.includes('500 hours') || fullText.includes('1000 hours') || fullText.includes('1500 hours')) {
          return
        }

        const cleanDescription = this.extractTextFromHTML(description)
        const location = this.extractLocation(cleanDescription)
        const aircraftType = this.extractAircraftType(cleanDescription)

        jobs.push({
          title,
          description: cleanDescription.substring(0, 500),
          location: location || undefined,
          aircraftType: aircraftType || undefined,
          postedDate: pubDate ? new Date(pubDate) : undefined,
          applicationUrl: link,
          source: 'aviationjobsearch.com',
          sourceUrl: link
        })
      })
    } catch (error) {
      console.error('Error scraping AviationJobSearch RSS:', error)
    }
    return jobs
  }

  static async scrapeEASARSS(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const xmlContent = await this.fetchRSS('https://jobs.easa.europa.eu/rss')
      const $ = this.parseXMLContent(xmlContent)
      
      if (!$) return jobs

      $('item').each((index: number, element: any) => {
        const $item = $(element)
        const title = $item.find('title').text().trim()
        const description = $item.find('description').text().trim()
        const link = $item.find('link').text().trim()
        const pubDate = $item.find('pubDate').text().trim()
        
        if (!title || !link) return
        
        // Only include aviation-related jobs
        const fullText = `${title} ${description}`.toLowerCase()
        if (!fullText.includes('pilot') && !fullText.includes('aviation') && !fullText.includes('flight')) return

        const cleanDescription = this.extractTextFromHTML(description)
        const location = this.extractLocation(cleanDescription)

        jobs.push({
          title,
          description: cleanDescription.substring(0, 500),
          location: location || undefined,
          postedDate: pubDate ? new Date(pubDate) : undefined,
          applicationUrl: link,
          source: 'jobs.easa.europa.eu',
          sourceUrl: link
        })
      })
    } catch (error) {
      console.error('Error scraping EASA RSS:', error)
    }
    return jobs
  }

  static async scrapeFlyingWayRSS(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const xmlContent = await this.fetchRSS('https://flyingway.com/feed')
      const $ = this.parseXMLContent(xmlContent)
      
      if (!$) return jobs

      $('item').each((index: number, element: any) => {
        const $item = $(element)
        const title = $item.find('title').text().trim()
        const description = $item.find('description').text().trim()
        const link = $item.find('link').text().trim()
        const pubDate = $item.find('pubDate').text().trim()
        
        if (!title || !link) return
        
        // Only include pilot jobs
        const fullText = `${title} ${description}`.toLowerCase()
        if (!fullText.includes('pilot') && !this.isCPLJob(fullText)) return
        
        // Skip high hour requirements
        if (fullText.includes('500 hours') || fullText.includes('1000 hours') || fullText.includes('1500 hours')) {
          return
        }

        const cleanDescription = this.extractTextFromHTML(description)
        const location = this.extractLocation(cleanDescription)
        const aircraftType = this.extractAircraftType(cleanDescription)

        jobs.push({
          title,
          description: cleanDescription.substring(0, 500),
          location: location || undefined,
          aircraftType: aircraftType || undefined,
          postedDate: pubDate ? new Date(pubDate) : undefined,
          applicationUrl: link,
          source: 'flyingway.com',
          sourceUrl: link
        })
      })
    } catch (error) {
      console.error('Error scraping FlyingWay RSS:', error)
    }
    return jobs
  }

  static async scrapeFlightJobsFeed(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      // Flight International Jobs RSS
      const xmlContent = await this.fetchRSS('https://www.flightglobal.com/jobs/rss')
      const $ = this.parseXMLContent(xmlContent)
      
      if (!$) return jobs

      $('item').each((index: number, element: any) => {
        const $item = $(element)
        const title = $item.find('title').text().trim()
        const description = $item.find('description').text().trim()
        const link = $item.find('link').text().trim()
        const pubDate = $item.find('pubDate').text().trim()
        
        if (!title || !link) return
        
        // Only include pilot jobs
        const fullText = `${title} ${description}`.toLowerCase()
        if (!fullText.includes('pilot') && !this.isCPLJob(fullText)) return

        const cleanDescription = this.extractTextFromHTML(description)
        const location = this.extractLocation(cleanDescription)

        jobs.push({
          title,
          description: cleanDescription.substring(0, 500),
          location: location || undefined,
          postedDate: pubDate ? new Date(pubDate) : undefined,
          applicationUrl: link,
          source: 'flightglobal.com',
          sourceUrl: link
        })
      })
    } catch (error) {
      console.error('Error scraping FlightJobs RSS:', error)
    }
    return jobs
  }

  static async scrapeAllRSSFeeds(): Promise<JobListing[]> {
    console.log('Starting RSS feed scraping...')
    
    const scrapers = [
      this.scrapePilotCareerCentreRSS,
      this.scrapeAviationJobSearchRSS,
      this.scrapeEASARSS,
      this.scrapeFlyingWayRSS,
      this.scrapeFlightJobsFeed
    ]

    const results = await Promise.allSettled(
      scrapers.map(scraper => scraper())
    )

    const allJobs: JobListing[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`RSS Feed ${index + 1}: Found ${result.value.length} jobs`)
        allJobs.push(...result.value)
      } else {
        console.error(`RSS Feed ${index + 1} failed:`, result.reason)
      }
    })

    console.log(`Total jobs found from RSS feeds: ${allJobs.length}`)
    return allJobs
  }
}
