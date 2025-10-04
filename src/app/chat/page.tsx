'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  MessageSquare,
  Zap
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async () => {
      const response = await fetch('/api/chat')
      const data = await response.json()
      return data.messages || []
    }
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
      setMessage('')
      setIsLoading(false)
    },
    onError: () => {
      setIsLoading(false)
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    sendMessageMutation.mutate(message)
  }

  const quickQuestions = [
    "What's my best performing campaign?",
    "Show me CTR trends this week",
    "Which platform has the highest ROAS?",
    "Are there any anomalies in my data?",
    "How can I improve my conversion rate?"
  ]

  const handleQuickQuestion = (question: string) => {
    setMessage(question)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-gray-600">Ask questions about your marketing data and get AI-powered insights</p>
          </div>
          <Badge variant="secondary" className="flex items-center">
            <Zap className="mr-1 h-3 w-3" />
            Powered by GPT-4o-mini
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] min-h-[500px] max-h-[700px] flex flex-col">
              <CardHeader className="border-b flex-shrink-0">
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading conversation...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Bot className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Start a conversation</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Ask me anything about your marketing data and campaigns.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-3 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 break-words ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.role === 'user' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4 flex-shrink-0 bg-white">
                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask about your marketing data..."
                      disabled={isLoading}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button type="submit" disabled={isLoading || !message.trim()} className="px-4">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Questions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-3"
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isLoading}
                  >
                    <span className="text-sm">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">What I can help with</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-600">
                  <p>• Campaign performance analysis</p>
                  <p>• Trend identification</p>
                  <p>• Anomaly detection</p>
                  <p>• Optimization recommendations</p>
                  <p>• Metric explanations</p>
                  <p>• Data insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
