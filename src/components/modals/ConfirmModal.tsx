import { Modal, Btn } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onConfirm: (() => void) | null
  onClose: () => void
}

export function ConfirmModal({ open, title, message, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={440}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => { onConfirm?.(); onClose() }}>Confirmar</Btn>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}
