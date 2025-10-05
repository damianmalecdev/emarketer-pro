'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

export default function AlertsPage() {
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts')
      const data = await response.json()
      return data.alerts || []
    }
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, isRead: true })
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    }
  })

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'success':
        return 'default'
      default:
        return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white border-red-600'
      case 'high':
        return 'bg-orange-500 text-white border-orange-600'
      case 'medium':
        return 'bg-yellow-500 text-white border-yellow-600'
      case 'low':
        return 'bg-green-500 text-white border-green-600'
      default:
        return 'bg-gray-500 text-white border-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadAlerts = alerts.filter((alert: any) => !alert.isRead)
  const readAlerts = alerts.filter((alert: any) => alert.isRead)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor your marketing campaigns and performance</p>
          </div>
          <Badge variant="secondary" className="flex items-center px-4 py-2 text-base">
            <Bell className="mr-2 h-4 w-4" />
            {unreadAlerts.length} unread
          </Badge>
        </div>

        {/* Unread Alerts */}
        {unreadAlerts.length > 0 && (
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="flex items-center text-xl">
                <Bell className="mr-2 h-6 w-6 text-blue-600" />
                Unread Alerts ({unreadAlerts.length})
              </CardTitle>
              <CardDescription className="text-base">
                New notifications that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {unreadAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 border-2 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <p className="text-base font-semibold text-gray-900">
                          {alert.message}
                        </p>
                        <Badge className={`${getSeverityColor(alert.severity)} font-semibold`}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsReadMutation.mutate(alert.id)}
                    disabled={markAsReadMutation.isPending}
                    className="hover:bg-gray-100"
                  >
                    {markAsReadMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Alerts */}
        <Card className="shadow-md">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl">All Alerts</CardTitle>
            <CardDescription className="text-base">
              Complete history of your marketing alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 mt-4 text-gray-600">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No alerts yet</h3>
                <p className="mt-2 text-base text-gray-600 max-w-sm mx-auto">
                  Alerts will appear here when we detect important changes in your campaigns.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`flex items-start justify-between p-4 border-2 rounded-lg transition-all ${
                      alert.isRead 
                        ? 'bg-gray-50 border-gray-200 hover:border-gray-300' 
                        : 'bg-white border-blue-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2 flex-wrap">
                          <p className={`text-base ${alert.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                            {alert.message}
                          </p>
                          <Badge className={`${getSeverityColor(alert.severity)} font-semibold`}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(alert.id)}
                        disabled={markAsReadMutation.isPending}
                        className="hover:bg-gray-100"
                      >
                        {markAsReadMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </Button>
                    )}
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
