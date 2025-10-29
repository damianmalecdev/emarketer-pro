// src/app/dashboard/reports/page.tsx
'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  return (
    <section className="container py-24 my-16">
      <div className="rounded-3xl bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 p-8 md:p-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-2">Coming soon: scheduled reports and custom dashboards.</p>
          </div>
          <Link href="/dashboard/settings">
            <Button variant="outline">Go to Settings</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Report Builder</CardTitle>
              <CardDescription>Create custom performance reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Emails</CardTitle>
              <CardDescription>Automate weekly and monthly summaries.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
