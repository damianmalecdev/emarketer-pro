"use client";

import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, TrendingUp, Users, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MetaAccount = { id: string; name: string; currency?: string }
type MetaCampaign = { id: string; name: string; status?: string }

export default function MetaPage() {
  const { activeCompany } = useCompany();
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([])
  const [metrics, setMetrics] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => {
    const until = new Date()
    const since = new Date()
    since.setDate(until.getDate() - 7)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    return { since: fmt(since), until: fmt(until) }
  }, [])

  useEffect(() => {
    if (!activeCompany) return
    setLoading(true)
    fetch(`/api/meta-ads/accounts?companyId=${activeCompany.id}`)
      .then(r => r.json())
      .then(d => {
        setAccounts(d.accounts || [])
        if (d.accounts?.[0]?.id) setSelectedAccount(d.accounts[0].id)
      })
      .catch(() => setError("Failed to load accounts"))
      .finally(() => setLoading(false))
  }, [activeCompany])

  useEffect(() => {
    if (!activeCompany || !selectedAccount) return
    setLoading(true)
    
    // Fetch campaigns from new API
    fetch(`/api/meta-ads/campaigns?accountId=${selectedAccount}`)
      .then(r => r.json())
      .then(d => {
        setCampaigns(d.campaigns || [])
      })
      .catch(() => setError("Failed to load campaigns"))
      .finally(() => setLoading(false))
    
    // Note: Metrics require a campaign ID, so we'll load them separately when needed
    // For now, just set empty metrics
    setMetrics({})
  }, [activeCompany, selectedAccount])

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Facebook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-muted-foreground">Please select a company to view Meta Ads data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta Ads</h1>
          <p className="text-muted-foreground">Monitor your Facebook and Instagram ad performance</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/settings">
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Integration
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.spend || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Facebook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.impressions || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.clicks || 0}</div>
            <p className="text-xs text-muted-foreground">CTR {metrics?.ctr ?? 0}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.actions || []).find((a: any) => a.action_type === 'purchase')?.value || 0}</div>
            <p className="text-xs text-muted-foreground">Purchases (if available)</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts & Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts & Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!accounts.length ? (
            <p className="text-muted-foreground">No Meta account connected. Connect in settings.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Account</label>
                <select
                  className="border rounded px-2 py-1"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  disabled={loading}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} {a.currency ? `(${a.currency})` : ''}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => {
                  if (!activeCompany || !selectedAccount) return
                  setLoading(true)
                  fetch(`/api/meta-ads/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: selectedAccount })
                  })
                    .then(r => r.json())
                    .then(d => {
                      if (d.success) {
                        alert('Sync started successfully!')
                      } else {
                        alert('Sync failed: ' + d.error)
                      }
                    })
                    .catch(() => alert('Sync failed'))
                    .finally(() => setLoading(false))
                }}>Sync now</Button>
              </div>
              <div className="border rounded">
                <div className="p-3 text-sm font-medium border-b">Campaigns ({campaigns.length})</div>
                <div className="max-h-64 overflow-auto divide-y">
                  {campaigns.map(c => (
                    <div key={c.id} className="p-3 text-sm flex items-center justify-between">
                      <div className="font-medium">{c.name}</div>
                      <span className="text-xs text-muted-foreground">{c.status || 'unknown'}</span>
                    </div>
                  ))}
                  {!campaigns.length && (
                    <div className="p-3 text-sm text-muted-foreground">No campaigns found</div>
                  )}
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Integration CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Meta Ads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Connect your Meta Ads account to start tracking Facebook and Instagram campaigns, audiences, and performance metrics.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard/settings">
                Connect Meta Ads
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://business.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer">
                Visit Meta Ads Manager
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Facebook className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Advanced Analytics Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're working on detailed campaign analytics, audience insights, creative performance, and automated optimization features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
