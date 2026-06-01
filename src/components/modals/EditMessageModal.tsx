import { useState, useEffect } from 'react'
import { Modal, Btn } from './Modal'
import type { Message } from '../../types'

interface EditMessageModalProps {
  open: boolean
  msg: Message | null
  onSave: (msgId: string, newContent: string) => void
  onClose: () => void
}

export function EditMessageModal({ open, msg, onSave, onClose }: EditMessageModalProps) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (msg) setText(msg.content)
  }, [msg])

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed || !msg) return
    onSave(msg.id, trimmed)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar mensaje"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={handleSave}>Guardar y regenerar</Btn>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: '100%', minHeight: 120, resize: 'vertical',
          background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)', padding: '10px 12px',
          fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
          lineHeight: 1.6, outline: 'none',
        }}
        autoFocus
      />
    </Modal>
  )
}
