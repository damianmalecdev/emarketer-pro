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
  Filter
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
        return <AlertTriangle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
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
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const unreadAlerts = alerts.filter((alert: any) => !alert.isRead)
  const readAlerts = alerts.filter((alert: any) => alert.isRead)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="text-gray-600">Monitor your marketing campaigns and performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center">
              <Bell className="mr-1 h-3 w-3" />
              {unreadAlerts.length} unread
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetch('/api/mock-data', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-mock-alerts' })
              })}
            >
              <Filter className="mr-2 h-4 w-4" />
              Generate Mock Alerts
            </Button>
          </div>
        </div>

        {/* Unread Alerts */}
        {unreadAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Unread Alerts ({unreadAlerts.length})
              </CardTitle>
              <CardDescription>
                New notifications that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {unreadAlerts.map((alert: any) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <AlertDescription className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span>{alert.message}</span>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(alert.createdAt)}
                        </p>
                      </AlertDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(alert.id)}
                      disabled={markAsReadMutation.isPending}
                    >
                      {markAsReadMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>All Alerts</CardTitle>
            <CardDescription>
              Complete history of your marketing alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Alerts will appear here when we detect important changes in your campaigns.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`flex items-start justify-between p-4 border rounded-lg ${
                      alert.isRead ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className={`text-sm ${alert.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                            {alert.message}
                          </p>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
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
                      >
                        {markAsReadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
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
