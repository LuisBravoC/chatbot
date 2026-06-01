import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ConversationItem } from './ConversationItem'
import type { Conversation } from '../../types'

interface ConversationListProps {
  onDelete: (convId: string) => void
  onSelect?: () => void
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date()
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo  = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30)

  const groups: { title: string; items: Conversation[] }[] = [
    { title: 'Hoy',            items: [] },
    { title: 'Ayer',           items: [] },
    { title: 'Últimos 7 días', items: [] },
    { title: 'Últimos 30 días',items: [] },
    { title: 'Más antiguos',   items: [] },
  ]

  for (const c of conversations) {
    const d = new Date(c.updatedAt)
    if      (d >= today)    groups[0].items.push(c)
    else if (d >= yesterday) groups[1].items.push(c)
    else if (d >= weekAgo)   groups[2].items.push(c)
    else if (d >= monthAgo)  groups[3].items.push(c)
    else                     groups[4].items.push(c)
  }
  return groups.filter(g => g.items.length > 0)
}

export function ConversationList({ onDelete, onSelect }: ConversationListProps) {
  const { conversations, currentConversationId, searchQuery, setCurrentConversation } = useAppStore()

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
        {searchQuery ? 'Sin resultados' : 'Aún no hay conversaciones'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map(group => (
        <div key={group.title}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-tertiary)',
            padding: '10px 10px 4px',
          }}>
            {group.title}
          </div>
          {group.items.map(conv => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={conv.id === currentConversationId}
              onSelect={() => {
                setCurrentConversation(conv.id)
                onSelect?.()  // auto-colapsa en mobile
              }}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
