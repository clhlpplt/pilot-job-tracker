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
  private static async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      return ''
    }
  }

  static async scrapePilotCareerCentre(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const html = await this.fetchPage('https://pilotcareercentre.com/jobs')
      const $ = cheerio.load(html)
      
      $('.job-listing').each((index, element) => {
        const $el = $(element)
        const title = $el.find('.job-title').text().trim()
        const company = $el.find('.company-name').text().trim()
        const location = $el.find('.location').text().trim()
        const sourceUrl = $el.find('a').attr('href') || ''
        
        if (title && sourceUrl) {
          jobs.push({
            title,
            company,
            location,
            source: 'pilotcareercentre.com',
            sourceUrl: `https://pilotcareercentre.com${sourceUrl}`
          })
        }
      })
    } catch (error) {
      console.error('Error scraping PilotCareerCentre:', error)
    }
    return jobs
  }

  static async scrapePilotJobsNetwork(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const html = await this.fetchPage('https://pilotjobsnetwork.com/jobs')
      const $ = cheerio.load(html)
      
      $('.job-item').each((index, element) => {
        const $el = $(element)
        const title = $el.find('.job-title').text().trim()
        const company = $el.find('.airline').text().trim()
        const location = $el.find('.base').text().trim()
        const aircraftType = $el.find('.aircraft').text().trim()
        const sourceUrl = $el.find('a').attr('href') || ''
        
        if (title && sourceUrl) {
          jobs.push({
            title,
            company,
            location,
            aircraftType,
            source: 'pilotjobsnetwork.com',
            sourceUrl
          })
        }
      })
    } catch (error) {
      console.error('Error scraping PilotJobsNetwork:', error)
    }
    return jobs
  }

  static async scrapeFlyingWay(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const html = await this.fetchPage('https://flyingway.com/jobs')
      const $ = cheerio.load(html)
      
      $('.job-post').each((index, element) => {
        const $el = $(element)
        const title = $el.find('h3').text().trim()
        const company = $el.find('.company').text().trim()
        const location = $el.find('.location').text().trim()
        const sourceUrl = $el.find('a').attr('href') || ''
        
        if (title && sourceUrl) {
          jobs.push({
            title,
            company,
            location,
            source: 'flyingway.com',
            sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://flyingway.com${sourceUrl}`
          })
        }
      })
    } catch (error) {
      console.error('Error scraping FlyingWay:', error)
    }
    return jobs
  }

  static async scrapeAviationJobSearch(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const html = await this.fetchPage('https://aviationjobsearch.com/jobs/pilot')
      const $ = cheerio.load(html)
      
      $('.job').each((index, element) => {
        const $el = $(element)
        const title = $el.find('.job-title').text().trim()
        const company = $el.find('.company').text().trim()
        const location = $el.find('.location').text().trim()
        const salary = $el.find('.salary').text().trim()
        const sourceUrl = $el.find('a').attr('href') || ''
        
        if (title && sourceUrl) {
          jobs.push({
            title,
            company,
            location,
            salary,
            source: 'aviationjobsearch.com',
            sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://aviationjobsearch.com${sourceUrl}`
          })
        }
      })
    } catch (error) {
      console.error('Error scraping AviationJobSearch:', error)
    }
    return jobs
  }

  static async scrapeEASA(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const html = await this.fetchPage('https://jobs.easa.europa.eu')
      const $ = cheerio.load(html)
      
      $('.vacancy').each((index, element) => {
        const $el = $(element)
        const title = $el.find('.title').text().trim()
        const location = $el.find('.location').text().trim()
        const sourceUrl = $el.find('a').attr('href') || ''
        
        if (title && sourceUrl) {
          jobs.push({
            title,
            location,
            source: 'jobs.easa.europa.eu',
            sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://jobs.easa.europa.eu${sourceUrl}`
          })
        }
      })
    } catch (error) {
      console.error('Error scraping EASA:', error)
    }
    return jobs
  }

  static async scrapeLinkedIn(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const searchQuery = 'aviation pilot jobs Europe Africa'
      const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(searchQuery)}&location=Europe&locationId=101282230&locationId=102095883`
      const html = await this.fetchPage(url)
      const $ = cheerio.load(html)
      
      $('.job-search-card').each((index, element) => {
        const $el = $(element)
        const title = $el.find('.job-search-card__title').text().trim()
        const company = $el.find('.job-search-card__subtitle').text().trim()
        const location = $el.find('.job-search-card__location').text().trim()
        const sourceUrl = $el.find('a').attr('href') || ''
        
        if (title && sourceUrl) {
          jobs.push({
            title,
            company,
            location,
            source: 'linkedin.com',
            sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://www.linkedin.com${sourceUrl}`
          })
        }
      })
    } catch (error) {
      console.error('Error scraping LinkedIn:', error)
    }
    return jobs
  }

  static async scrapeIndeed(): Promise<JobListing[]> {
    const jobs: JobListing[] = []
    try {
      const searchQuery = 'pilot jobs Europe Africa'
      const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}`
      const html = await this.fetchPage(url)
      const $ = cheerio.load(html)
      
      '.job_seen_beacon'.split(',').forEach(selector => {
        $(selector).each((index, element) => {
          const $el = $(element)
          const title = $el.find('.jobTitle').text().trim()
          const company = $el.find('.companyName').text().trim()
          const location = $el.find('.companyLocation').text().trim()
          const sourceUrl = $el.find('a').attr('href') || ''
          
          if (title && sourceUrl) {
            jobs.push({
              title,
              company,
              location,
              source: 'indeed.com',
              sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://www.indeed.com${sourceUrl}`
            })
          }
        })
      })
    } catch (error) {
      console.error('Error scraping Indeed:', error)
    }
    return jobs
  }

  static async scrapeAllSources(): Promise<JobListing[]> {
    const scrapers = [
      this.scrapePilotCareerCentre,
      this.scrapePilotJobsNetwork,
      this.scrapeFlyingWay,
      this.scrapeAviationJobSearch,
      this.scrapeEASA,
      this.scrapeLinkedIn,
      this.scrapeIndeed
    ]

    const results = await Promise.allSettled(
      scrapers.map(scraper => scraper())
    )

    const allJobs: JobListing[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value)
      } else {
        console.error(`Scraper ${index} failed:`, result.reason)
      }
    })

    return allJobs
  }
}
