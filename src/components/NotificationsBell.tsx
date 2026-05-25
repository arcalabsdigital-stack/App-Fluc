import { useState, useEffect } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationsBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Trigger process recurring as background
    supabase.rpc('process_recurring_transactions' as any).then()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const removeNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    const notification = notifications.find((n) => n.id === id)
    setNotifications(notifications.filter((n) => n.id !== id))
    if (notification && !notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] font-bold text-white border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-xl shadow-xl border-gray-100 mt-2"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount} novas
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-900"
            >
              <Check className="w-3 h-3 mr-1" />
              Lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px] sm:h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <Bell className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                Nenhuma notificação
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Você está em dia com seus avisos!
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-colors group relative ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-primary/5 hover:bg-primary/10'}`}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <h4
                          className={`text-sm truncate font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}
                        >
                          {n.title}
                        </h4>
                      </div>
                      <p
                        className={`text-xs break-words leading-relaxed ${n.is_read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}
                      >
                        {n.message}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium mt-2 block">
                        {format(
                          new Date(n.created_at),
                          "dd 'de' MMM 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 md:group-hover:opacity-100 transition-opacity"
                      onClick={(e) => removeNotification(n.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
