import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateChatResponse(messages: Array<{role: string, content: string}>, context?: string) {
  try {
    const systemMessage = {
      role: 'system' as const,
      content: `You are eMarketer.pro AI Assistant, an expert marketing analytics assistant specialized in Meta Ads, Google Ads, and Google Analytics.

You help users understand their marketing data, campaigns, and performance metrics. You have access to the user's real campaign data from their connected platforms.

${context ? `\n=== USER'S DATA ===${context}\n==================\n` : ''}

Your capabilities:
- Analyze campaign performance across Meta Ads and Google Ads
- Explain marketing metrics (CTR, CPC, ROAS, CPA, impressions, conversions, etc.)
- Identify trends, anomalies, and optimization opportunities
- Provide actionable marketing insights and recommendations
- Answer questions about specific campaigns or overall account performance
- Compare performance across platforms and time periods
- Suggest budget allocation and bidding strategies

Guidelines:
- Always base your answers on the actual data provided in the context above
- Use specific numbers and campaign names when referring to data
- If asked about something not in the data, explain what's missing
- Provide actionable recommendations, not just observations
- Use clear, professional language
- Format numbers for readability (e.g., "$1,234.56", "12.5%", "3.2x ROAS")
- When discussing multiple campaigns, prioritize by revenue or ROAS
- If user has no data yet, guide them to connect their platforms in Settings

Be helpful, accurate, and insightful!`
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      max_tokens: 1000,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
  } catch (error) {
    console.error('OpenAI API error:', error)
    return "I'm sorry, I'm having trouble connecting to the AI service right now."
  }
}

export async function generateReportSummary(data: any, type: 'weekly' | 'monthly') {
  try {
    const prompt = `Generate a comprehensive ${type} marketing report summary based on the following data:
    
    ${JSON.stringify(data, null, 2)}
    
    Please provide:
    1. Executive summary (2-3 sentences)
    2. Key performance indicators
    3. Top performing campaigns
    4. Areas of concern or opportunities
    5. Recommendations for improvement
    
    Keep it professional and actionable.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.5,
    })

    return response.choices[0]?.message?.content || "Unable to generate report summary."
  } catch (error) {
    console.error('OpenAI report generation error:', error)
    return "Unable to generate report summary at this time."
  }
}
