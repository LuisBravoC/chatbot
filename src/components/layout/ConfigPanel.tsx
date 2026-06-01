import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { exportConversation } from '../../utils/export'
import { estimateTokens, countWords } from '../../utils/formatting'

interface ConfigPanelProps {
  onClose: () => void
  onDeleteConversation: () => void
}

const PRESETS: { label: string; value: string }[] = [
  { label: 'Por defecto',  value: 'Eres un asistente útil, preciso y amigable. Responde de forma clara y concisa en el idioma del usuario.' },
  { label: 'Programador',  value: 'Eres un experto programador senior. Das código bien documentado, explicaciones técnicas profundas y buenas prácticas.' },
  { label: 'Profesor',     value: 'Eres un profesor paciente que explica conceptos complejos de forma sencilla, con analogías y ejemplos.' },
  { label: 'Escritor',     value: 'Eres un escritor creativo y poético. Usa lenguaje vívido, metáforas y estructuras narrativas atractivas.' },
  { label: 'Escritor Pro', value: 'Eres un asistente de escritura profesional. Ayudas con emails, documentos y comunicaciones formales o informales.' },
  { label: 'JSON',         value: 'Responde siempre en formato JSON válido con la estructura solicitada.' },
  { label: 'Traductor',    value: 'Eres un traductor profesional. Traduce manteniendo el tono, contexto y matices culturales.' },
  { label: 'Sin prompt',   value: '' },
]

export function ConfigPanel({ onClose, onDeleteConversation }: ConfigPanelProps) {
  const { config, setConfig, getCurrentConversation } = useAppStore()
  const conv = getCurrentConversation()

  const allText = conv?.messages.map(m => m.content).join(' ') ?? ''
  const stats = {
    messages: conv?.messages.length ?? 0,
    words: countWords(allText),
    chars: allText.length,
    tokens: estimateTokens(allText),
  }

  const handleConfigChange = (key: string, value: unknown) => {
    setConfig({ [key]: value })
    // Invalidar sesión al cambiar parámetros del modelo
    if (['temperature', 'topK', 'systemPrompt'].includes(key)) {
      useAppStore.getState().clearSession()
    }
  }

  return (
    <aside style={{
      width: 340,
      minWidth: 340,  /* evita que el contenido se deforme durante la animación */
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-primary)',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border-primary)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
            <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
            <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          Configuración
        </div>
        <button onClick={onClose} style={iconBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Body scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Parámetros del modelo */}
        <Section title="Parámetros del modelo" icon="edit">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SliderField label="Temperature" id="temperature" min={0} max={2} step={0.1}
              value={config.temperature} onChange={(v) => handleConfigChange('temperature', v)}
              leftLabel="Preciso" rightLabel="Creativo" />
            <SliderField label="Top K" id="topK" min={1} max={100} step={1}
              value={config.topK} onChange={(v) => handleConfigChange('topK', v)}
              leftLabel="Enfocado" rightLabel="Diverso" />
            <ToggleField label="Descargar modelo automáticamente" checked={config.autoDownloadModel ?? false}
              onChange={(v) => setConfig({ autoDownloadModel: v })}
              hint="Si está activo, el modelo se descarga al abrir la app sin necesidad de hacer clic" />
            <ToggleField label="Streaming de respuesta" checked={config.streaming} onChange={(v) => setConfig({ streaming: v })} />
            <ToggleField label="Auto-scroll" checked={config.autoScroll} onChange={(v) => setConfig({ autoScroll: v })} />
            <ToggleField label="Mostrar timestamps" checked={config.showTimestamps} onChange={(v) => setConfig({ showTimestamps: v })} />
            <ToggleField label="Renderizar Markdown" checked={config.renderMarkdown} onChange={(v) => setConfig({ renderMarkdown: v })} />
          </div>
        </Section>

        {/* Prompt del sistema */}
        <Section title="Prompt del sistema" icon="chat">
          <textarea
            value={config.systemPrompt}
            onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
            placeholder="Instrucciones para el modelo..."
            style={{
              width: '100%', minHeight: 90, resize: 'vertical',
              background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)', padding: '8px 10px',
              fontSize: 13, color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)', lineHeight: 1.5,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => handleConfigChange('systemPrompt', p.value)}
                style={{
                  background: config.systemPrompt === p.value ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  color: config.systemPrompt === p.value ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >{p.label}</button>
            ))}
          </div>
        </Section>

        {/* Estadísticas */}
        <Section title="Estadísticas de la sesión" icon="stats">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Mensajes', stats.messages], ['Palabras', stats.words.toLocaleString('es-ES')],
              ['Caracteres', stats.chars.toLocaleString('es-ES')], ['Tokens (est.)', `~${stats.tokens.toLocaleString('es-ES')}`]
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Acciones conversación */}
        <Section title="Conversación actual" icon="download">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Exportar como JSON',     action: () => conv && exportConversation(conv, 'json') },
              { label: 'Exportar como Markdown', action: () => conv && exportConversation(conv, 'markdown') },
              { label: 'Exportar como texto',    action: () => conv && exportConversation(conv, 'text') },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} style={{ ...sidebarBtnStyle }}>
                {label}
              </button>
            ))}
            <button onClick={onDeleteConversation} style={{ ...sidebarBtnStyle, color: 'var(--error)', borderColor: 'var(--error)', opacity: 0.8 }}>
              Eliminar conversación
            </button>
          </div>
        </Section>

        {/* Info del modelo */}
        <Section title="Información del modelo" icon="info">
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>Modelo:</strong> Gemini Nano</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>API:</strong> window.LanguageModel</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Ejecución:</strong> Local (on-device)</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Privacidad:</strong> Total — datos no salen del navegador</div>
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-tertiary)' }}>Requiere Chrome/Edge 128+ con Built-in AI.</div>
          </div>
        </Section>
      </div>
    </aside>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
type SectionIconKey = 'edit' | 'chat' | 'stats' | 'download' | 'info'
interface SectionProps { title: string; icon: SectionIconKey; children: React.ReactNode }
function Section({ title, icon, children }: SectionProps) {
  const ICONS: Record<SectionIconKey, React.ReactElement> = {
    edit:     <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    chat:     <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    stats:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontWeight: 600, fontSize: 12.5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</svg>
        {title}
      </div>
      {children}
    </div>
  )
}

interface SliderFieldProps {
  label: string
  id: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  leftLabel: string
  rightLabel: string
}
function SliderField({ label, id, min, max, step, value, onChange, leftLabel, rightLabel }: SliderFieldProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label htmlFor={id} style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)', minWidth: 30, textAlign: 'right' }}>
          {step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="config-slider" style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  )
}

interface ToggleFieldProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}
function ToggleField({ label, checked, onChange, hint }: ToggleFieldProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>
      {hint && (
        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.4 }}>{hint}</p>
      )}
    </div>
  )
}

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 6,
  borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
  display: 'flex', alignItems: 'center',
}

const sidebarBtnStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-md)', padding: '8px 12px',
  cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13,
  textAlign: 'left', transition: 'var(--transition-fast)', width: '100%',
}
