import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateChatResponse(messages: Array<{role: string, content: string}>, context?: string) {
  try {
    const systemMessage = {
      role: 'system' as const,
      content: `You are eMarketer.pro AI Assistant, a helpful marketing analytics assistant. 
      You help users understand their marketing data, campaigns, and performance metrics.
      ${context ? `Context: ${context}` : ''}
      
      You can help with:
      - Analyzing campaign performance
      - Explaining marketing metrics (CTR, CPC, ROAS, etc.)
      - Identifying trends and anomalies
      - Providing marketing insights and recommendations
      - Answering questions about marketing data
      
      Always be helpful, accurate, and professional. If you don't have access to specific data, 
      explain what information would be needed to provide a better answer.`
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
