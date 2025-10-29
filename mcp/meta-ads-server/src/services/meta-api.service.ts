import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk'
import type {
  MetaAdAccount,
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaInsights,
  MetaPagedResponse,
  MetaCustomAudience,
  MetaPixel,
  MetaLeadForm,
  MetaLead,
  MetaBatchRequest,
  MetaBatchResponse,
} from '../types/meta-api.types'
import { logger } from '../utils/logger'
import { rateLimiter } from '../utils/rate-limiter'
import { MetaAPIError } from '../utils/error-handler'

export interface MetaAPIClientConfig {
  accessToken: string
  accountId?: string
}

export class MetaAPIService {
  private api: FacebookAdsApi
  private accessToken: string
  private accountId?: string

  constructor(config: MetaAPIClientConfig) {
    this.accessToken = config.accessToken
    this.accountId = config.accountId

    // Initialize Facebook SDK
    FacebookAdsApi.init(this.accessToken)
    this.api = FacebookAdsApi.getInstance()

    logger.debug('Meta API Service initialized', {
      hasToken: !!this.accessToken,
      hasAccountId: !!this.accountId,
    })
  }

  /**
   * Make a GET request to Graph API
   */
  private async get<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`https://graph.facebook.com/v21.0/${path}`)
    url.searchParams.set('access_token', this.accessToken)

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })

    logger.debug('Meta API GET request', { path, params })

    try {
      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok || data.error) {
        throw new MetaAPIError(data.error)
      }

      return data as T
    } catch (error) {
      logger.error('Meta API GET error', { path, error })
      throw error
    }
  }

  /**
   * Make a POST request to Graph API
   */
  private async post<T>(
    path: string,
    body: Record<string, any> = {}
  ): Promise<T> {
    const url = `https://graph.facebook.com/v21.0/${path}`

    const formData = new URLSearchParams()
    formData.set('access_token', this.accessToken)

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    })

    logger.debug('Meta API POST request', { path, body })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new MetaAPIError(data.error)
      }

      return data as T
    } catch (error) {
      logger.error('Meta API POST error', { path, error })
      throw error
    }
  }

  /**
   * Make a DELETE request to Graph API
   */
  private async delete(path: string): Promise<{ success: boolean }> {
    const url = `https://graph.facebook.com/v21.0/${path}?access_token=${this.accessToken}`

    logger.debug('Meta API DELETE request', { path })

    try {
      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok || data.error) {
        throw new MetaAPIError(data.error)
      }

      return data
    } catch (error) {
      logger.error('Meta API DELETE error', { path, error })
      throw error
    }
  }

  // ============================================
  // AD ACCOUNTS
  // ============================================

  async getAccount(accountId: string): Promise<MetaAdAccount> {
    return this.get<MetaAdAccount>(accountId, {
      fields: 'id,account_id,name,account_status,currency,timezone_name,business,amount_spent,balance,spend_cap,daily_spend_limit',
    })
  }

  async listAccounts(): Promise<MetaPagedResponse<MetaAdAccount>> {
    return this.get<MetaPagedResponse<MetaAdAccount>>('me/adaccounts', {
      fields: 'id,account_id,name,account_status,currency,timezone_name,business',
      limit: 100,
    })
  }

  // ============================================
  // CAMPAIGNS
  // ============================================

  async getCampaign(campaignId: string): Promise<MetaCampaign> {
    return this.get<MetaCampaign>(campaignId, {
      fields: 'id,name,status,effective_status,objective,special_ad_categories,buying_type,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time',
    })
  }

  async listCampaigns(
    accountId: string,
    options: { limit?: number; after?: string } = {}
  ): Promise<MetaPagedResponse<MetaCampaign>> {
    return this.get<MetaPagedResponse<MetaCampaign>>(`${accountId}/campaigns`, {
      fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time',
      limit: options.limit || 100,
      after: options.after,
    })
  }

  async createCampaign(accountId: string, params: {
    name: string
    objective: string
    status?: string
    special_ad_categories?: string[]
    buying_type?: string
    daily_budget?: number
    lifetime_budget?: number
    start_time?: string
    stop_time?: string
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${accountId}/campaigns`, params)
  }

  async updateCampaign(campaignId: string, params: any): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(campaignId, params)
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(campaignId, { status: 'DELETED' })
  }

  // ============================================
  // AD SETS
  // ============================================

  async getAdSet(adSetId: string): Promise<MetaAdSet> {
    return this.get<MetaAdSet>(adSetId, {
      fields: 'id,name,campaign_id,status,effective_status,optimization_goal,billing_event,bid_amount,bid_strategy,daily_budget,lifetime_budget,start_time,end_time,targeting,attribution_spec,created_time,updated_time',
    })
  }

  async listAdSets(
    campaignId: string,
    options: { limit?: number; after?: string } = {}
  ): Promise<MetaPagedResponse<MetaAdSet>> {
    return this.get<MetaPagedResponse<MetaAdSet>>(`${campaignId}/adsets`, {
      fields: 'id,name,status,effective_status,optimization_goal,daily_budget,lifetime_budget',
      limit: options.limit || 100,
      after: options.after,
    })
  }

  async createAdSet(campaignId: string, params: {
    name: string
    optimization_goal: string
    billing_event: string
    bid_amount?: number
    daily_budget?: number
    lifetime_budget?: number
    start_time?: string
    end_time?: string
    targeting: any
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${campaignId}/adsets`, params)
  }

  async updateAdSet(adSetId: string, params: any): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(adSetId, params)
  }

  // ============================================
  // ADS
  // ============================================

  async getAd(adId: string): Promise<MetaAd> {
    return this.get<MetaAd>(adId, {
      fields: 'id,name,adset_id,campaign_id,status,effective_status,configured_status,creative,tracking_specs,conversion_specs,created_time,updated_time',
    })
  }

  async listAds(
    adSetId: string,
    options: { limit?: number; after?: string } = {}
  ): Promise<MetaPagedResponse<MetaAd>> {
    return this.get<MetaPagedResponse<MetaAd>>(`${adSetId}/ads`, {
      fields: 'id,name,status,effective_status,creative',
      limit: options.limit || 100,
      after: options.after,
    })
  }

  async createAd(adSetId: string, params: {
    name: string
    creative: { creative_id: string }
    status?: string
    tracking_specs?: any[]
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${adSetId}/ads`, params)
  }

  async updateAd(adId: string, params: any): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(adId, params)
  }

  async getAdPreviews(adId: string, format: string = 'DESKTOP_FEED_STANDARD'): Promise<any> {
    return this.get(`${adId}/previews`, {
      ad_format: format,
    })
  }

  // ============================================
  // INSIGHTS (METRICS)
  // ============================================

  async getInsights(
    entityId: string,
    params: {
      level?: string
      time_range?: { since: string; until: string }
      date_preset?: string
      time_increment?: number | string
      fields?: string
      breakdowns?: string[]
    }
  ): Promise<MetaPagedResponse<MetaInsights>> {
    const fields = params.fields || 'impressions,reach,frequency,clicks,spend,ctr,cpc,cpm,actions,action_values,cost_per_action_type,inline_link_clicks,cost_per_inline_link_click'

    return this.get<MetaPagedResponse<MetaInsights>>(`${entityId}/insights`, {
      level: params.level || 'ad',
      time_range: params.time_range ? JSON.stringify(params.time_range) : undefined,
      date_preset: params.date_preset,
      time_increment: params.time_increment,
      fields,
      breakdowns: params.breakdowns?.join(','),
    })
  }

  // ============================================
  // CUSTOM AUDIENCES
  // ============================================

  async listCustomAudiences(accountId: string): Promise<MetaPagedResponse<MetaCustomAudience>> {
    return this.get<MetaPagedResponse<MetaCustomAudience>>(`${accountId}/customaudiences`, {
      fields: 'id,name,description,subtype,approximate_count,retention_days,delivery_status',
      limit: 100,
    })
  }

  async createCustomAudience(accountId: string, params: {
    name: string
    subtype: string
    description?: string
    customer_file_source?: string
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${accountId}/customaudiences`, params)
  }

  // ============================================
  // PIXELS
  // ============================================

  async listPixels(accountId: string): Promise<MetaPagedResponse<MetaPixel>> {
    return this.get<MetaPagedResponse<MetaPixel>>(`${accountId}/adspixels`, {
      fields: 'id,name,code,last_fired_time',
      limit: 100,
    })
  }

  // ============================================
  // LEAD ADS
  // ============================================

  async listLeadForms(accountId: string): Promise<MetaPagedResponse<MetaLeadForm>> {
    return this.get<MetaPagedResponse<MetaLeadForm>>(`${accountId}/leadgen_forms`, {
      fields: 'id,name,status,locale,privacy_policy_url,questions,context_card,thank_you_page',
      limit: 100,
    })
  }

  async getLeads(formId: string): Promise<MetaPagedResponse<MetaLead>> {
    return this.get<MetaPagedResponse<MetaLead>>(`${formId}/leads`, {
      fields: 'id,created_time,ad_id,form_id,field_data,is_organic,platform',
      limit: 100,
    })
  }

  // ============================================
  // BATCH REQUESTS
  // ============================================

  async batchRequest(requests: MetaBatchRequest[]): Promise<MetaBatchResponse[]> {
    if (requests.length > 50) {
      throw new Error('Batch requests limited to 50 operations')
    }

    return this.post<MetaBatchResponse[]>('/', {
      batch: JSON.stringify(requests),
    })
  }
}

