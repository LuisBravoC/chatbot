import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import type { Message } from '../../types'

interface ChatAreaProps {
  onSend: (text: string) => void
  onStop: () => void
  onEdit: (msg: Message) => void
  onRegenerate: (msgId: string) => void
}

/**
 * ChatArea
 * Contenedor principal del área de chat: lista de mensajes + input.
 * Recibe callbacks para edición y regeneración (manejados por AppLayout).
 */
export function ChatArea({ onSend, onStop, onEdit, onRegenerate }: ChatAreaProps) {
  const handleSuggestionClick = (prompt: string) => {
    onSend(prompt)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      <MessageList
        onEdit={onEdit}
        onRegenerate={onRegenerate}
        onSuggestionClick={handleSuggestionClick}
      />
      <InputArea
        onSend={onSend}
        onStop={onStop}
      />
    </div>
  )
}
