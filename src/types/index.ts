import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

export interface Campaign {
  id: string
  name: string
  platform: string
  campaignId: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roas: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  severity: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  metadata?: any
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  title: string
  type: 'weekly' | 'monthly' | 'custom'
  period: string
  summary: string
  aiComment?: string
  fileUrl?: string
  data?: any
  createdAt: string
  updatedAt: string
}

export interface Integration {
  id: string
  platform: 'meta' | 'google' | 'ga4'
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  accountId?: string
  accountName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
  createdAt: string
}

export interface Event {
  id: string
  eventName: string
  eventValue?: number
  eventTime: string
  source: string
  campaignId?: string
  createdAt: string
}

export interface User {
  id: string
  name?: string
  email: string
  image?: string
  plan: 'free' | 'pro' | 'enterprise'
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface KPIData {
  totalSpend: number
  totalRevenue: number
  totalClicks: number
  totalConversions: number
  avgCTR: number
  avgCPC: number
  avgROAS: number
}

export interface ChartData {
  date: string
  spend: number
  revenue: number
  clicks: number
  impressions?: number
  conversions?: number
}

export interface TopCampaign {
  name: string
  platform: string
  spend: number
  revenue: number
  roas: number
}
