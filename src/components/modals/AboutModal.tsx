import React from 'react'
import { Modal, Btn } from './Modal'

type IconKey = 'lock' | 'bolt' | 'bar' | 'eye'

const FEATURES: { icon: IconKey; title: string; desc: string }[] = [
  { icon: 'lock', title: '100% Privado', desc: 'Todo se procesa localmente. Tus datos nunca salen de tu dispositivo.' },
  { icon: 'bolt', title: 'Rápido y eficiente', desc: 'Inferencia optimizada en tu dispositivo sin latencia de red.' },
  { icon: 'bar', title: 'Sin límites', desc: 'Usa el modelo tanto como quieras, sin cuotas ni suscripciones.' },
  { icon: 'eye', title: 'Código abierto', desc: 'Inspecciónalo, modifícalo y compártelo libremente.' },
]

const ICONS: Record<IconKey, React.ReactElement> = {
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  bolt: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  bar:  <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  eye:  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
}

interface AboutModalProps { open: boolean; onClose: () => void }
export function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Acerca de Happy Chat"
      footer={<Btn variant="primary" onClick={onClose}>Entendido</Btn>}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
        Una aplicación de chat que ejecuta <strong>Gemini Nano</strong> directamente en tu navegador,
        sin enviar datos a servidores externos.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--bg-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[f.icon]}
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
