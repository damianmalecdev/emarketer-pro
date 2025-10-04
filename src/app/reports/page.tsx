'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Download, 
  Calendar,
  Loader2,
  Plus,
  Eye
} from 'lucide-react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const queryClient = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports')
      const data = await response.json()
      return data.reports || []
    }
  })

  const generateReportMutation = useMutation({
    mutationFn: async (data: { type: string; startDate: string; endDate: string }) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setIsGenerating(false)
    },
    onError: () => {
      setIsGenerating(false)
    }
  })

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select start and end dates')
      return
    }

    setIsGenerating(true)
    generateReportMutation.mutate({
      type: reportType,
      startDate,
      endDate
    })
  }

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'weekly':
        return 'bg-blue-100 text-blue-800'
      case 'monthly':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Generate and manage your marketing reports</p>
          </div>
        </div>

        {/* Generate New Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create a comprehensive marketing report with AI insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={(value: 'weekly' | 'monthly') => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className="w-full md:w-auto"
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>

            {generateReportMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to generate report. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {generateReportMutation.isSuccess && (
              <Alert>
                <AlertDescription>
                  Report generated successfully! Check the reports list below.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Your generated marketing reports and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading reports...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate your first marketing report to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                        <Badge className={getReportTypeColor(report.type)}>
                          {report.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Period: {report.period}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Generated: {formatDate(report.createdAt)}
                      </p>
                      {report.summary && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {report.summary.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {report.fileUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={report.fileUrl} download>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
