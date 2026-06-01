import { useAppStore } from '../../store/useAppStore'

const STATUS_MAP = {
  checking:       { label: 'Verificando modelo...', cls: '' },
  ready:          { label: 'Gemini Nano listo',      cls: 'ready' },
  'needs-download': { label: 'Modelo no descargado', cls: '' },
  downloading:    { label: 'Descargando modelo',     cls: 'downloading' },
  error:          { label: 'Error al cargar modelo', cls: 'error' },
  unsupported:    { label: 'API no soportada',        cls: 'error' },
}

export function ModelStatus() {
  const { modelStatus, downloadProgress } = useAppStore()
  const { label, cls } = STATUS_MAP[modelStatus] ?? STATUS_MAP.checking

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Punto de estado */}
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
        background: cls === 'ready' ? 'var(--success)'
          : cls === 'error' ? 'var(--error)'
          : cls === 'downloading' ? 'var(--warning)'
          : 'var(--text-tertiary)',
        boxShadow: cls === 'ready' ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
        animation: cls === 'downloading' ? 'pulse 1.5s infinite' : 'none',
      }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      {modelStatus === 'downloading' && downloadProgress > 0 && (
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{downloadProgress}%</span>
      )}
    </div>
  )
}
