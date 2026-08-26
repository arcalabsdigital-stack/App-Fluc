import * as React from 'react'
import { MessageCircle, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatBubble } from '@/components/ui/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat-message-list'
import { ChatInput } from '@/components/ui/chat-input'
import { chatService } from '@/services/chatService'

interface Message {
  role: 'user' | 'agent'
  text: string
}

const INITIAL_MESSAGE: Message = {
  role: 'agent',
  text: 'Oi! Sou seu mentor financeiro. Posso te ajudar a entender seus números.',
}

export function ExpandableChat() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next && messages.length === 0) {
        setMessages([INITIAL_MESSAGE])
      }
      return next
    })
  }

  const handleSend = async (message: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setIsLoading(true)

    try {
      const data = await chatService.sendMessage(message)
      setMessages((prev) => [...prev, { role: 'agent', text: data.response }])
      setIsLoading(false)
    } catch (error) {
      console.error('Error in chat:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: 'Não consegui responder agora, tente de novo.',
        },
      ])
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <Button
        onClick={handleToggle}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat com mentor financeiro'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Painel de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] max-h-[80vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-none">
                  Mentor Financeiro
                </h3>
                <p className="text-xs text-primary-foreground/80 mt-0.5">
                  Assistente Inteligente
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground rounded-full"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de mensagens */}
          <ChatMessageList className="bg-gray-50/50">
            {messages.map((msg, index) =>
              msg.role === 'user' ? (
                <ChatBubble key={index} variant="sent">
                  {msg.text}
                </ChatBubble>
              ) : (
                <ChatBubble
                  key={index}
                  variant="received"
                  layout="ai"
                  markdown={true}
                >
                  {msg.text}
                </ChatBubble>
              ),
            )}
            {isLoading && (
              <ChatBubble variant="received" layout="ai" isLoading={true} />
            )}
          </ChatMessageList>

          {/* Input de chat */}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      )}
    </>
  )
}
