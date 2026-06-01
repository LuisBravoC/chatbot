import { Modal, Btn } from './Modal'

interface ShortcutsModalProps { open: boolean; onClose: () => void }

const SHORTCUTS: [string, string[]][] = [
  ['Nueva conversación',        ['Ctrl', 'N']],
  ['Enviar mensaje',            ['Enter']],
  ['Nueva línea',               ['Shift', 'Enter']],
  ['Detener generación',        ['Escape']],
  ['Panel de configuración',    ['Ctrl', 'P']],
  ['Mostrar/ocultar sidebar',   ['Ctrl', 'B']],
  ['Buscar conversaciones',     ['Ctrl', 'K']],
  ['Exportar conversación',     ['Ctrl', 'E']],
  ['Ciclar temas',              ['Ctrl', 'D']],
  ['Limpiar input',             ['Ctrl', 'L']],
]

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Atajos de teclado"
      footer={<Btn variant="primary" onClick={onClose}>Cerrar</Btn>}>
      <div style={{ display: 'grid', gap: 8 }}>
        {SHORTCUTS.map(([action, keys]) => (
          <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{action}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {keys.map((k, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {i > 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>+</span>}
                  <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{k}</kbd>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
