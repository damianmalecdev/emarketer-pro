import express from 'express'

const app = express()
const PORT = process.env.MCP_META_PORT ? Number(process.env.MCP_META_PORT) : 8921

app.get('/health', (_req, res) => res.json({ ok: true }))

// Helper to call Meta Graph API
async function graph(path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/v19.0/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error(`Meta API error: ${r.status}`)
  return r.json()
}

// Tools
app.get('/tools/accounts', async (req, res) => {
  try {
    const accessToken = String(req.query.access_token || '')
    if (!accessToken) return res.status(400).json({ error: 'Missing access_token' })
    const me = await graph('me/adaccounts', { access_token: accessToken, fields: 'id,name,currency,account_status' })
    res.json({ accounts: me.data || [] })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

app.get('/tools/campaigns', async (req, res) => {
  try {
    const accessToken = String(req.query.access_token || '')
    const accountId = String(req.query.account_id || '')
    if (!accessToken || !accountId) return res.status(400).json({ error: 'Missing params' })
    const data = await graph(`${accountId}/campaigns`, { access_token: accessToken, fields: 'id,name,status,effective_status' })
    res.json({ campaigns: data.data || [] })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

app.get('/tools/insights', async (req, res) => {
  try {
    const accessToken = String(req.query.access_token || '')
    const accountId = String(req.query.account_id || '')
    const since = String(req.query.since || '')
    const until = String(req.query.until || '')
    if (!accessToken || !accountId || !since || !until) return res.status(400).json({ error: 'Missing params' })
    const metrics = await graph(`${accountId}/insights`, {
      access_token: accessToken,
      time_range: JSON.stringify({ since, until }),
      level: 'account',
      fields: 'spend,impressions,clicks,actions,ctr,cpc,cpm'
    })
    res.json({ metrics: metrics.data?.[0] || {} })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[mcp:meta] listening on http://localhost:${PORT}`)
})


