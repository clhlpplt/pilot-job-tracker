# Pilot Job Tracker

A professional web application for tracking aviation job opportunities, built specifically for CPL pilots looking for their first commercial job. Features AI-powered job scoring, automated daily scraping, and intelligent filtering based on your pilot profile.

## Features

- **Automated Job Scraping**: Daily scraping of 13+ aviation job websites
- **AI-Powered Scoring**: Intelligent job matching based on your pilot profile
- **Daily Email Digest**: Automated email summaries at 07:00 UTC
- **Mobile Dashboard**: Clean, responsive web interface for job management
- **Smart Filtering**: Filter by location, aircraft type, match score, and application status
- **Vercel Deployment**: Ready-to-deploy with Vercel cron jobs

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: Groq Llama 3.3 70B Versatile for job scoring
- **Email**: Resend for daily digests
- **Deployment**: Vercel with cron jobs

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pilot-job-tracker
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pilot_job_tracker"

# Groq API for AI scoring
GROQ_API_KEY="your-groq-api-key"

# Resend for email delivery
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# User email for daily digests
USER_EMAIL="your-email@example.com"

# Optional: Cron secret for security
CRON_SECRET="your-secret-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

### 4. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Pilot Profile Configuration

The app is pre-configured for your profile:

- **Total Hours**: 140
- **PIC Hours**: 75
- **Ratings**: CPL, MEP, IR, SEP
- **Languages**: English (C1), Italian (native), French (native), Spanish (A2), German (A2)
- **Target Regions**: Europe, Africa
- **Open to**: All commercial opportunities

You can modify these values in the database or through the API.

## Job Sources

The app automatically scrapes these websites daily:

- pilotcareercentre.com
- pilotjobsnetwork.com
- flyingway.com
- aviationjobsearch.com
- jobs.easa.europa.eu
- cathayjobs.com
- ryanair.com/careers
- wizz.jobs
- easyjet.com/careers
- cabincrewwings.com
- afklcareers.com
- linkedin.com/jobs (aviation filter)
- indeed.com (pilot filter Europe and Africa)

## AI Scoring Logic

Jobs are automatically scored and categorized:

### Perfect Match
- Specifically mentions "CPL with low hours"
- Keywords: "low hour", "entry level", "fresh CPL", "hour building"
- Score: 85-95

### Priority
- Located in Europe or Africa
- Compatible with your ratings (MEP, SEP)
- Reasonable hour requirements (< 500)
- Score: 70-84

### Not Suitable
- Requires > 500 hours
- Requires type rating you don't have
- Outside target regions
- Score: 0-49

## API Endpoints

### Jobs API
- `GET /api/jobs` - Fetch jobs with filtering and pagination
- `PATCH /api/jobs` - Update job status

### Cron API
- `GET /api/cron/daily-scrape` - Manual trigger for daily scraping

Query parameters for `/api/jobs`:
- `status` - Filter by application status
- `category` - Filter by match category
- `location` - Filter by location
- `aircraft` - Filter by aircraft type
- `page` - Pagination page number
- `limit` - Items per page
- `sortBy` - Sort field
- `sortOrder` - Sort direction

## Deployment to Vercel

### 1. Prepare for Deployment

1. Push your code to GitHub
2. Install Vercel CLI: `npm i -g vercel`
3. Link your project: `vercel link`

### 2. Environment Variables on Vercel

Add all environment variables from `.env.local` to your Vercel project settings:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable from your `.env.local`

### 3. Deploy

```bash
vercel --prod
```

### 4. Set Up Cron Job

The `vercel.json` file is already configured for daily execution at 07:00 UTC. Vercel will automatically set up the cron job when you deploy.

## Database Setup on Vercel

### Option 1: Vercel Postgres (Recommended)

1. In Vercel dashboard, go to Storage
2. Create a new Postgres database
3. Copy the connection string to your environment variables
4. Run migrations: `npx prisma db push`

### Option 2: External PostgreSQL

1. Set up a PostgreSQL database (Neon, Supabase, Railway, etc.)
2. Add the connection string to `DATABASE_URL`
3. Run migrations: `npx prisma db push`

## Email Setup with Resend

1. Sign up for [Resend](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to environment variables

## Manual Testing

### Test Job Scraping

```bash
# Test the scraping endpoint
curl -X GET "http://localhost:3000/api/cron/daily-scrape" \
  -H "Authorization: Bearer your-cron-secret"
```

### Test Jobs API

```bash
# Fetch all jobs
curl "http://localhost:3000/api/jobs"

# Filter by category
curl "http://localhost:3000/api/jobs?category=PERFECT_MATCH"

# Update job status
curl -X PATCH "http://localhost:3000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{"id": "job-id", "status": "applied"}'
```

## Monitoring and Logs

- Check Vercel Functions logs for scraping execution
- Monitor email delivery in Resend dashboard
- Database queries visible in Prisma Studio: `npx prisma studio`

## Customization

### Adding New Job Sources

1. Add a new scraper method in `src/lib/scrapers.ts`
2. Include it in the `scrapeAllSources()` method
3. Test the new scraper

### Modifying AI Scoring

Update the scoring logic in `src/lib/ai-scoring.ts`:
- Adjust hour thresholds
- Add new keyword patterns
- Modify category criteria

### Customizing Email Templates

Edit the HTML template in `src/lib/email-service.ts` to match your preferred style.

## Troubleshooting

### Common Issues

1. **Jobs not appearing**: Check Vercel function logs for scraping errors
2. **Emails not sending**: Verify Resend API key and domain configuration
3. **Database connection errors**: Ensure `DATABASE_URL` is correct and accessible
4. **AI scoring failing**: Check Groq API key and quota

### Debug Mode

Add debug logging by setting:
```env
DEBUG=true
```

## Security Considerations

- Cron endpoint is protected with optional `CRON_SECRET`
- Database credentials are stored in environment variables
- API keys are never exposed to the frontend
- All scraping requests include user-agent headers

## Performance

- Jobs are cached in database to avoid duplicate scraping
- AI scoring is batched to respect rate limits
- Pagination limits database queries
- Responsive design ensures mobile performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Vercel function logs
3. Verify environment variables
4. Test individual components

---

**Good luck with your job search! 🛩️**
