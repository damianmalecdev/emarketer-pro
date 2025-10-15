// src/types/index.ts

export interface Company {
  id: string
  name: string
  domain?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Membership {
  id: string
  userId: string
  companyId: string
  role: 'owner' | 'manager' | 'analyst'
  createdAt: Date
}

export interface Integration {
  id: string
  companyId: string
  platform: 'google-ads' | 'meta' | 'tiktok' | 'ga4'
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: Date | null
  accountId?: string | null
  accountName?: string | null
  currency?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Campaign {
  id: string
  companyId: string
  integrationId?: string | null
  name: string
  platform: string
  platformCampaignId: string
  status?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CampaignMetric {
  id: string
  campaignId: string
  date: Date
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roas: number
  cpa: number
  createdAt: Date
}

export interface MetricsOverview {
  totalSpend: number
  totalRevenue: number
  roas: number
  totalConversions: number
  totalImpressions: number
  totalClicks: number
  ctr: number
  cpc: number
  cos: number
  engagementRate: number
}

export interface CampaignPerformance {
  campaignId: string
  campaignName: string
  totalSpend: number
  totalRevenue: number
  roas: number
  totalConversions: number
  totalImpressions: number
  totalClicks: number
  ctr: number
  cpc: number
  cos: number
  engagementRate: number
}

