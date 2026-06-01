import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getAPIDebugInfo } from '../../services/geminiService'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return ''
  const gb = bytes / 1e9
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / 1e6
  return `${Math.round(mb)} MB`
}

// ── Sub-paneles por estado ─────────────────────────────────────────────────

function CheckingPanel() {
  return (
    <div style={cardStyle}>
      <div style={{ ...iconWrapStyle, background: 'var(--bg-tertiary)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'spin 1.2s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
      <h2 style={titleStyle}>Verificando modelo...</h2>
      <p style={descStyle}>Comprobando disponibilidad de Gemini Nano en este dispositivo.</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

interface NeedsDownloadPanelProps { onDownload: () => void; autoDownload: boolean }
function NeedsDownloadPanel({ onDownload, autoDownload }: NeedsDownloadPanelProps) {
  return (
    <div style={cardStyle}>
      {/* Icono */}
      <div style={{ ...iconWrapStyle, background: 'rgba(99,102,241,0.12)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>

      <h2 style={titleStyle}>Gemini Nano está casi listo</h2>
      <p style={descStyle}>
        El modelo de IA se ejecutará <strong>100% en tu dispositivo</strong> — sin servidores externos,
        sin internet después de la descarga.
      </p>

      {/* Info chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', margin: '4px 0' }}>
        {[
          { icon: '💾', text: '≈ 1.7 GB' },
          { icon: '🔒', text: 'Totalmente privado' },
          { icon: '⚡', text: 'Solo la primera vez' },
          { icon: '🌐', text: 'Sin internet después' },
        ].map(c => (
          <span key={c.text} style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 12px',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {c.icon} {c.text}
          </span>
        ))}
      </div>

      {autoDownload ? (
        /* Modo automático: el useEffect en AppLayout dispara la descarga */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Iniciando descarga automática...
        </div>
      ) : (
        /* Modo manual: botón explícito */
        <button
          onClick={onDownload}
          style={{
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            padding: '13px 32px',
            cursor: 'pointer',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            transition: 'var(--transition-fast)',
            marginTop: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar Gemini Nano
        </button>
      )}

      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
        El navegador gestiona la descarga. No cierres esta pestaña hasta que termine.
      </p>
    </div>
  )
}

interface DownloadingPanelProps { onCancel: () => void }
function DownloadingPanel({ onCancel }: DownloadingPanelProps) {
  const { downloadProgress } = useAppStore()

  return (
    <div style={cardStyle}>
      <div style={{ ...iconWrapStyle, background: 'rgba(99,102,241,0.12)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'bounce-down 1s ease-in-out infinite' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>

      <h2 style={titleStyle}>Descargando Gemini Nano...</h2>
      <p style={descStyle}>No cierres el navegador. La descarga continúa en segundo plano.</p>

      {/* Barra de progreso */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          height: 10,
          overflow: 'hidden',
          border: '1px solid var(--border-primary)',
        }}>
          <div style={{
            height: '100%',
            width: `${downloadProgress}%`,
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px rgba(99,102,241,0.5)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {downloadProgress > 0 ? `${downloadProgress}% completado` : 'Iniciando descarga...'}
          </span>
          {downloadProgress > 0 && (
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{downloadProgress}%</span>
          )}
        </div>
      </div>

      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: '1.5px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 20px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: 13,
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--error)'; e.currentTarget.style.color = 'var(--error)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        Cancelar descarga
      </button>

      <style>{`
        @keyframes bounce-down {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  )
}

interface CopyButtonProps { value: string }
function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        flexShrink: 0,
        background: 'none',
        border: '1px solid var(--border-primary)',
        borderRadius: 6,
        padding: '3px 9px',
        cursor: 'pointer',
        fontSize: 11,
        color: copied ? 'var(--success)' : 'var(--text-tertiary)',
        transition: 'var(--transition-fast)',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

interface UnsupportedPanelProps { onRetry?: () => void }
function UnsupportedPanel({ onRetry }: UnsupportedPanelProps) {
  const [showDebug, setShowDebug] = useState(false)
  const debug = getAPIDebugInfo()

  const flagSteps = [
    { flag: '#prompt-api-for-gemini-nano',         label: 'Habilita la API de Gemini Nano' },
    { flag: '#optimization-guide-on-device-model', label: 'Habilita la optimización on-device' },
  ]

  const stepBase: React.CSSProperties = {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    padding: '11px 14px',
    textAlign: 'left',
  }

  return (
    <div style={{ ...cardStyle, maxWidth: 500 }}>
      <div style={{ ...iconWrapStyle, background: 'rgba(245,158,11,0.12)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <h2 style={titleStyle}>API de Gemini Nano no disponible</h2>
      <p style={descStyle}>
        Necesitas <strong>Chrome 128+</strong> o <strong>Edge 128+</strong> con
        las siguientes opciones activadas en las flags del navegador:
      </p>

      {/* Lista de pasos */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Paso 1 */}
        <div style={{ ...stepBase, display: 'flex', alignItems: 'center', gap: 10 }}>
          <StepNum>1</StepNum>
          <span style={stepTextStyle}>
            Abre{' '}
            <code style={inlineCodeStyle}>chrome://flags</code>
            {' '}en tu navegador
          </span>
          <CopyButton value="chrome://flags" />
        </div>

        {/* Pasos de flags */}
        {flagSteps.map((s, i) => (
          <div key={s.flag} style={stepBase}>
            {/* Fila: número + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <StepNum>{i + 2}</StepNum>
              <span style={stepTextStyle}>{s.label}</span>
            </div>
            {/* Fila: code + botón copiar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-code)',
              borderRadius: 6,
              padding: '6px 10px',
              marginLeft: 28, /* indentación alineada con el texto */
            }}>
              <code style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-code)',
                wordBreak: 'break-all',
              }}>
                {s.flag}
              </code>
              <CopyButton value={s.flag} />
            </div>
            <p style={{ marginLeft: 28, marginTop: 5, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              Cambia el valor a <strong style={{ color: 'var(--success)' }}>Enabled</strong>
            </p>
          </div>
        ))}

        {/* Paso final */}
        <div style={{ ...stepBase, display: 'flex', alignItems: 'center', gap: 10 }}>
          <StepNum>{flagSteps.length + 2}</StepNum>
          <span style={stepTextStyle}>Reinicia el navegador y recarga esta página</span>
        </div>
      </div>

      {/* Botones acción */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href="https://developer.chrome.com/docs/ai/prompt-api"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Ver documentación
        </a>
        {onRetry && (
          <button onClick={onRetry} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Reintentar detección
          </button>
        )}
      </div>

      {/* Diagnóstico de API — desplegable */}
      <div style={{ width: '100%', textAlign: 'left' }}>
        <button
          onClick={() => setShowDebug(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: showDebug ? 'rotate(90deg)' : 'none', transition: 'var(--transition-fast)' }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          Información de diagnóstico
        </button>
        {showDebug && (
          <pre style={{
            marginTop: 6,
            background: 'var(--bg-code)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            fontSize: 11.5,
            color: 'var(--text-code)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
          }}>
            {Object.entries(debug).map(([k, v]) => `${k}: ${v}`).join('\n')}
          </pre>
        )}
      </div>
    </div>
  )
}

/* Número de paso en burbuja */
interface StepNumProps { children: React.ReactNode }
function StepNum({ children }: StepNumProps) {
  return (
    <span style={{
      width: 22, height: 22,
      borderRadius: '50%',
      background: 'var(--accent-primary)',
      color: 'white',
      fontSize: 11,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

const stepTextStyle = { fontSize: 13, color: 'var(--text-secondary)', flex: 1 }
const inlineCodeStyle = {
  background: 'var(--bg-code)',
  color: 'var(--text-code)',
  padding: '1px 5px',
  borderRadius: 4,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
}

interface ErrorPanelProps { onRetry: () => void }
function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div style={cardStyle}>
      <div style={{ ...iconWrapStyle, background: 'rgba(239,68,68,0.1)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 style={titleStyle}>Error al cargar el modelo</h2>
      <p style={descStyle}>Algo fue mal al verificar o descargar Gemini Nano.</p>
      <button
        onClick={onRetry}
        style={{
          background: 'var(--accent-gradient)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '10px 24px',
          cursor: 'pointer',
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'var(--transition-fast)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reintentar
      </button>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

interface ModelSetupPanelProps {
  onDownload: () => void
  onCancel: () => void
  onRetry: () => void
}
export function ModelSetupPanel({ onDownload, onCancel, onRetry }: ModelSetupPanelProps) {
  const { modelStatus, config } = useAppStore()
  const autoDownload = config.autoDownloadModel ?? false

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--bg-primary)',
      overflowY: 'auto',
    }}>
      {modelStatus === 'checking' && <CheckingPanel />}
      {modelStatus === 'needs-download' && <NeedsDownloadPanel onDownload={onDownload} autoDownload={autoDownload} />}
      {modelStatus === 'downloading' && <DownloadingPanel onCancel={onCancel} />}
      {modelStatus === 'unsupported' && <UnsupportedPanel onRetry={onRetry} />}
      {modelStatus === 'error' && <ErrorPanel onRetry={onRetry} />}
    </div>
  )
}

// ── Estilos compartidos ────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 18,
  maxWidth: 520,
  width: '100%',
  padding: '40px 32px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-lg)',
  textAlign: 'center',
}

const iconWrapStyle = {
  width: 72,
  height: 72,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: 0,
}

const descStyle = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
  margin: 0,
}
