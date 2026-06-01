import { Modal, Btn } from './Modal'

interface TemplatesModalProps {
  open: boolean
  onClose: () => void
  onSelect: (template: string) => void
}

const TEMPLATES: { title: string; desc: string; template: string }[] = [
  { title: '📧 Email profesional', desc: 'Redacta un email formal con parámetros personalizables', template: 'Escribe un email profesional para {destinatario} sobre {asunto}. El tono debe ser {tono} y debe incluir: {puntos clave}.' },
  { title: '💡 Explicación con analogías', desc: 'Aprende conceptos complejos mediante comparaciones', template: 'Explica el concepto de {concepto} usando una analogía simple. Incluye 3 ejemplos prácticos de la vida real y una conclusión clara.' },
  { title: '📚 Guía completa', desc: 'Aprende cualquier habilidad paso a paso', template: 'Actúa como un experto en {tema}. Dame una guía paso a paso para {objetivo}, incluyendo herramientas necesarias, errores comunes a evitar y mejores prácticas.' },
  { title: '🔍 Análisis de código', desc: 'Revisión profesional de código fuente', template: 'Analiza el siguiente código y dame: 1) Qué hace 2) Posibles errores 3) Mejoras de rendimiento 4) Mejoras de legibilidad\n\n```\n{código}\n```' },
  { title: '🎨 Brainstorming', desc: 'Genera ideas creativas y organizadas', template: 'Genera 10 ideas creativas sobre {tema}. Para cada idea incluye: nombre, descripción breve, nivel de dificultad, y posible impacto.' },
  { title: '📄 Resumen multi-formato', desc: 'Resume textos en diferentes formatos útiles', template: 'Resume el siguiente texto en 3 formatos: 1) En una frase 2) En 3 puntos clave 3) Párrafo resumido de 100 palabras\n\n{texto}' },
  { title: '🎯 Entrevista simulada', desc: 'Practica entrevistas de trabajo o técnicas', template: 'Eres un entrevistador experto. Hazme preguntas desafiantes sobre {tema}, una a la vez, y evalúa mis respuestas dándome feedback constructivo.' },
  { title: '🌐 Traducción profesional', desc: 'Traducciones con contexto cultural', template: 'Traduce el siguiente texto al {idioma}. Mantén el tono original, las expresiones idiomáticas adaptadas culturalmente y explica notas del traductor al final.\n\n{texto}' },
]

export function TemplatesModal({ open, onClose, onSelect }: TemplatesModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Plantillas de prompts" maxWidth={600}
      footer={<Btn variant="secondary" onClick={onClose}>Cerrar</Btn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TEMPLATES.map(t => (
          <button
            key={t.title}
            onClick={() => { onSelect(t.template); onClose() }}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--border-primary)' }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{t.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
