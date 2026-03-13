import { Resend } from 'resend'
import { JobListing } from './scrapers'
import { JobScore } from './ai-scoring'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailDigestData {
  totalJobs: number
  newJobs: number
  perfectMatches: number
  priorityJobs: number
  notSuitable: number
  jobs: Array<{
    job: JobListing
    score: JobScore
  }>
}

export class EmailService {
  static async sendDailyDigest(email: string, data: EmailDigestData): Promise<void> {
    if (!resend) {
      console.log('Resend not configured, skipping email digest')
      return
    }

    const html = this.generateEmailHTML(data)
    const subject = `Daily Pilot Job Digest - ${data.newJobs} New Opportunities Found`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@pilotjobtracker.com',
        to: [email],
        subject,
        html,
      })
      
      console.log(`Daily digest sent to ${email}`)
    } catch (error) {
      console.error('Error sending daily digest:', error)
      throw error
    }
  }

  private static generateEmailHTML(data: EmailDigestData): string {
    const perfectMatches = data.jobs.filter(j => j.score.category === 'PERFECT_MATCH')
    const priorityJobs = data.jobs.filter(j => j.score.category === 'PRIORITY')
    const notSuitable = data.jobs.filter(j => j.score.category === 'NOT_SUITABLE')

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Pilot Job Digest</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .summary-item {
            display: inline-block;
            margin: 10px 20px 10px 0;
        }
        .summary-number {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        .summary-label {
            font-size: 14px;
            color: #666;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        .job-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background: white;
            transition: box-shadow 0.2s;
        }
        .job-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .job-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        .job-company {
            font-size: 16px;
            color: #667eea;
            margin-bottom: 8px;
        }
        .job-location {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
        }
        .job-score {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        .score-perfect {
            background: #d4edda;
            color: #155724;
        }
        .score-priority {
            background: #fff3cd;
            color: #856404;
        }
        .score-not-suitable {
            background: #f8d7da;
            color: #721c24;
        }
        .job-notes {
            font-size: 14px;
            color: #555;
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .apply-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background 0.2s;
        }
        .apply-button:hover {
            background: #5a6fd8;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛩️ Daily Pilot Job Digest</h1>
        <p>Your personalized aviation job opportunities</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-number">${data.newJobs}</div>
            <div class="summary-label">New Jobs</div>
        </div>
        <div class="summary-item">
            <div class="summary-number">${perfectMatches.length}</div>
            <div class="summary-label">Perfect Matches</div>
        </div>
        <div class="summary-item">
            <div class="summary-number">${priorityJobs.length}</div>
            <div class="summary-label">Priority Jobs</div>
        </div>
        <div class="summary-item">
            <div class="summary-number">${notSuitable.length}</div>
            <div class="summary-label">Not Suitable</div>
        </div>
    </div>

    ${perfectMatches.length > 0 ? `
    <div class="section">
        <div class="section-title">⭐ Perfect Matches</div>
        ${perfectMatches.map(({ job, score }) => `
            <div class="job-card">
                <div class="job-title">${job.title}</div>
                ${job.company ? `<div class="job-company">${job.company}</div>` : ''}
                ${job.location ? `<div class="job-location">📍 ${job.location}</div>` : ''}
                <div class="job-score score-perfect">PERFECT MATCH</div>
                <div class="job-notes">${score.notes}</div>
                ${job.applicationUrl || job.sourceUrl ? `
                    <a href="${job.applicationUrl || job.sourceUrl}" class="apply-button">Apply Now →</a>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${priorityJobs.length > 0 ? `
    <div class="section">
        <div class="section-title">🎯 Priority Jobs</div>
        ${priorityJobs.map(({ job, score }) => `
            <div class="job-card">
                <div class="job-title">${job.title}</div>
                ${job.company ? `<div class="job-company">${job.company}</div>` : ''}
                ${job.location ? `<div class="job-location">📍 ${job.location}</div>` : ''}
                <div class="job-score score-priority">PRIORITY</div>
                <div class="job-notes">${score.notes}</div>
                ${job.applicationUrl || job.sourceUrl ? `
                    <a href="${job.applicationUrl || job.sourceUrl}" class="apply-button">View Job →</a>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${notSuitable.length > 0 ? `
    <div class="section">
        <div class="section-title">❌ Not Suitable</div>
        ${notSuitable.slice(0, 3).map(({ job, score }) => `
            <div class="job-card">
                <div class="job-title">${job.title}</div>
                ${job.company ? `<div class="job-company">${job.company}</div>` : ''}
                ${job.location ? `<div class="job-location">📍 ${job.location}</div>` : ''}
                <div class="job-score score-not-suitable">NOT SUITABLE</div>
                <div class="job-notes">${score.notes}</div>
            </div>
        `).join('')}
        ${notSuitable.length > 3 ? `<p><em>... and ${notSuitable.length - 3} more not suitable jobs</em></p>` : ''}
    </div>
    ` : ''}

    <div class="footer">
        <p>This email was generated by Pilot Job Tracker</p>
        <p>Good luck with your job search! 🛫</p>
    </div>
</body>
</html>
`
  }
}
