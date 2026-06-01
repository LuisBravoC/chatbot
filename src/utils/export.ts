import type { Conversation, ExportFormat } from '../types'

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeFilename(title: string): string {
  return title.replace(/[^\w\s-]/g, '').slice(0, 50)
}

export function exportConversation(conv: Conversation, format: ExportFormat = 'json'): void {
  if (!conv) return

  if (format === 'json') {
    const content = JSON.stringify(
      { exportDate: new Date().toISOString(), application: 'Gemini Nano Chat', conversation: conv },
      null,
      2,
    )
    downloadBlob(content, `${safeFilename(conv.title)}_${Date.now()}.json`, 'application/json')
  } else if (format === 'markdown') {
    const lines = [
      `# ${conv.title}`,
      '',
      `_Exportado: ${new Date(conv.updatedAt).toLocaleString('es-ES')}_`,
      '',
      '---',
      '',
    ]
    conv.messages.forEach((m) => {
      const role = m.role === 'user' ? '👤 Usuario' : '🤖 Asistente'
      const time = new Date(m.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      lines.push(`### ${role} (${time})`, '', m.content, '')
    })
    downloadBlob(lines.join('\n'), `${safeFilename(conv.title)}_${Date.now()}.md`, 'text/markdown')
  } else {
    const lines: string[] = []
    conv.messages.forEach((m) => {
      lines.push(`[${m.role === 'user' ? 'Usuario' : 'Asistente'}]`, m.content, '')
    })
    downloadBlob(lines.join('\n'), `${safeFilename(conv.title)}_${Date.now()}.txt`, 'text/plain')
  }
}

export function exportAllConversations(conversations: Conversation[]): void {
  if (!conversations.length) return
  const data = {
    exportDate: new Date().toISOString(),
    application: 'Gemini Nano Chat',
    version: '1.0',
    totalConversations: conversations.length,
    conversations,
  }
  downloadBlob(JSON.stringify(data, null, 2), `gemini_nano_chat_backup_${Date.now()}.json`, 'application/json')
}

export function parseImportFile(text: string): Conversation[] {
  const data = JSON.parse(text) as { conversations?: Conversation[]; conversation?: Conversation }
  if (data.conversations && Array.isArray(data.conversations)) {
    return data.conversations.filter((c) => c.id && c.messages)
  }
  if (data.conversation?.id) {
    return [data.conversation]
  }
  return []
}
