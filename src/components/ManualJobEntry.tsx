'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface ManualJobEntryProps {
  onJobAdded: () => void
}

export function ManualJobEntry({ onJobAdded }: ManualJobEntryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    aircraftType: '',
    description: '',
    requirements: '',
    applicationUrl: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/jobs/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          company: '',
          location: '',
          aircraftType: '',
          description: '',
          requirements: '',
          applicationUrl: ''
        })
        setIsOpen(false)
        onJobAdded()
      } else {
        const error = await response.json()
        alert(`Error adding job: ${error.error}`)
      }
    } catch (error) {
      alert('Error adding job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <Button 
              onClick={() => setIsOpen(true)}
              className="w-full md:w-auto"
            >
              + Add Manual Job Entry
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Found a job elsewhere? Add it manually to track your applications.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Manual Job Entry</CardTitle>
        <CardDescription>
          Enter job details to track opportunities you find outside our automated sources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., First Officer - A320"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Company
              </label>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="e.g., Lufthansa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Frankfurt, Germany"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Aircraft Type
              </label>
              <Select onValueChange={(value) => handleInputChange('aircraftType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A320">A320 Family</SelectItem>
                  <SelectItem value="A330">A330</SelectItem>
                  <SelectItem value="A350">A350</SelectItem>
                  <SelectItem value="A380">A380</SelectItem>
                  <SelectItem value="B737">B737 Family</SelectItem>
                  <SelectItem value="B747">B747</SelectItem>
                  <SelectItem value="B757">B757</SelectItem>
                  <SelectItem value="B767">B767</SelectItem>
                  <SelectItem value="B777">B777</SelectItem>
                  <SelectItem value="B787">B787</SelectItem>
                  <SelectItem value="E190">E190/E195</SelectItem>
                  <SelectItem value="CRJ">CRJ Series</SelectItem>
                  <SelectItem value="ATR">ATR Series</SelectItem>
                  <SelectItem value="Dash">Dash Series</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the role and responsibilities..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Requirements
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="e.g., CPL, 150 hours total, MEP rating..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Application URL
            </label>
            <Input
              value={formData.applicationUrl}
              onChange={(e) => handleInputChange('applicationUrl', e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Job'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
