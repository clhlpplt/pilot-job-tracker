"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, ExternalLink, Plane, MapPin, Clock, Users } from 'lucide-react'

interface Job {
  id: string
  title: string
  company?: string
  location?: string
  aircraftType?: string
  description?: string
  requirements?: string
  salary?: string
  postedDate?: string
  applicationUrl?: string
  source: string
  sourceUrl: string
  matchScore?: number
  matchCategory?: string
  aiNotes?: string
  status: string
  createdAt: string
}

interface JobsResponse {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    location: '',
    aircraft: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })
      
      const response = await fetch(`/api/jobs?${params}`)
      const data: JobsResponse = await response.json()
      
      setJobs(data.jobs)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [pagination.page, filters])

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status })
      })
      
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status } : job
      ))
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  const getMatchCategoryColor = (category?: string) => {
    switch (category) {
      case 'PERFECT_MATCH':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PRIORITY':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'NOT_SUITABLE':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'interview':
        return 'bg-purple-100 text-purple-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pilot Job Tracker</h1>
          <p className="text-gray-600">Track and manage your aviation career opportunities</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Match Category</label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="PERFECT_MATCH">Perfect Match</SelectItem>
                    <SelectItem value="PRIORITY">Priority</SelectItem>
                    <SelectItem value="NOT_SUITABLE">Not Suitable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Aircraft Type</label>
                <Input
                  placeholder="Filter by aircraft..."
                  value={filters.aircraft}
                  onChange={(e) => setFilters({...filters, aircraft: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Perfect Matches</p>
                  <p className="text-2xl font-bold">{jobs.filter(j => j.matchCategory === 'PERFECT_MATCH').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Priority Jobs</p>
                  <p className="text-2xl font-bold">{jobs.filter(j => j.matchCategory === 'PRIORITY').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Applied</p>
                  <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'applied').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Job Listings</CardTitle>
            <CardDescription>
              {loading ? 'Loading jobs...' : `Showing ${jobs.length} of ${pagination.total} jobs`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No jobs found matching your criteria</div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {job.matchCategory && (
                              <Badge className={getMatchCategoryColor(job.matchCategory)}>
                                {job.matchCategory.replace('_', ' ')}
                              </Badge>
                            )}
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                          
                          {job.company && (
                            <p className="text-gray-700 font-medium mb-1">{job.company}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                            )}
                            {job.aircraftType && (
                              <span className="flex items-center gap-1">
                                <Plane className="w-4 h-4" />
                                {job.aircraftType}
                              </span>
                            )}
                            {job.salary && (
                              <span className="flex items-center gap-1">
                                💰 {job.salary}
                              </span>
                            )}
                          </div>
                          
                          {job.aiNotes && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                              <p className="text-sm text-blue-800">
                                <strong>AI Analysis:</strong> {job.aiNotes}
                              </p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mb-3">
                            Source: {job.source} • Posted: {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Select
                              value={job.status}
                              onValueChange={(value) => updateJobStatus(job.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(job.applicationUrl || job.sourceUrl, '_blank')}
                            className="w-full"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
