// Meta Marketing API Response Types (v21.0+)

export interface MetaAdAccount {
  id: string
  account_id: string
  name: string
  account_status: number
  currency: string
  timezone_name: string
  business?: {
    id: string
    name: string
  }
  amount_spent?: string
  balance?: string
  spend_cap?: string
  daily_spend_limit?: string
}

export interface MetaCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string
  objective: string
  special_ad_categories?: string[]
  buying_type?: 'AUCTION' | 'RESERVED'
  daily_budget?: string
  lifetime_budget?: string
  budget_remaining?: string
  start_time?: string
  stop_time?: string
  created_time: string
  updated_time: string
}

export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string
  optimization_goal: string
  billing_event: string
  bid_amount?: number
  bid_strategy?: string
  daily_budget?: string
  lifetime_budget?: string
  budget_remaining?: string
  start_time?: string
  end_time?: string
  targeting?: any
  attribution_spec?: any[]
  created_time: string
  updated_time: string
}

export interface MetaAd {
  id: string
  name: string
  adset_id: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string
  configured_status: string
  creative?: {
    id: string
  }
  tracking_specs?: any[]
  conversion_specs?: any[]
  created_time: string
  updated_time: string
}

export interface MetaCreative {
  id: string
  name?: string
  object_type?: string
  title?: string
  body?: string
  image_url?: string
  video_id?: string
  link_url?: string
  call_to_action_type?: string
  object_story_spec?: any
  effective_object_story_id?: string
}

export interface MetaInsights {
  date_start: string
  date_stop: string
  impressions?: string
  reach?: string
  frequency?: string
  clicks?: string
  unique_clicks?: string
  spend?: string
  ctr?: string
  cpc?: string
  cpm?: string
  cpp?: string
  actions?: Array<{
    action_type: string
    value: string
  }>
  action_values?: Array<{
    action_type: string
    value: string
  }>
  cost_per_action_type?: Array<{
    action_type: string
    value: string
  }>
  website_ctr?: Array<{
    action_type: string
    value: string
  }>
  inline_link_clicks?: string
  inline_link_click_ctr?: string
  cost_per_inline_link_click?: string
  outbound_clicks?: Array<{
    action_type: string
    value: string
  }>
  unique_outbound_clicks?: Array<{
    action_type: string
    value: string
  }>
  purchase_roas?: Array<{
    action_type: string
    value: string
  }>
  video_play_actions?: Array<{
    action_type: string
    value: string
  }>
  video_avg_time_watched_actions?: Array<{
    action_type: string
    value: string
  }>
}

export interface MetaCustomAudience {
  id: string
  name: string
  description?: string
  subtype: string
  approximate_count?: number
  retention_days?: number
  delivery_status?: {
    code: number
    description: string
  }
  rule?: any
  lookalike_spec?: {
    type: string
    ratio: number
    starting_ratio?: number
    country: string
    origin?: any[]
  }
}

export interface MetaPixel {
  id: string
  name: string
  code?: string
  last_fired_time?: string
}

export interface MetaLeadForm {
  id: string
  name: string
  status: string
  locale?: string
  privacy_policy_url?: string
  questions?: any[]
  context_card?: {
    title: string
    content: string
  }
  thank_you_page?: {
    title: string
    body: string
  }
}

export interface MetaLead {
  id: string
  created_time: string
  ad_id?: string
  form_id: string
  field_data: Array<{
    name: string
    values: string[]
  }>
  is_organic?: boolean
  platform?: string
}

export interface MetaProductCatalog {
  id: string
  name: string
  business?: {
    id: string
    name: string
  }
  product_count?: number
  vertical?: string
}

export interface MetaPagedResponse<T> {
  data: T[]
  paging?: {
    cursors?: {
      before: string
      after: string
    }
    next?: string
    previous?: string
  }
}

export interface MetaError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    error_user_title?: string
    error_user_msg?: string
    fbtrace_id: string
  }
}

export interface MetaBatchRequest {
  method: 'GET' | 'POST' | 'DELETE'
  relative_url: string
  body?: string
}

export interface MetaBatchResponse {
  code: number
  headers: Array<{ name: string; value: string }>
  body: string
}

