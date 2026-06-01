export function TypingIndicator() {
  return (
    <div className="message ai" style={{ display: 'flex', gap: '10px', padding: '4px 0' }}>
      <div className="msg-avatar ai-avatar">G</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="msg-bubble ai-bubble" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--text-tertiary)',
                  animation: 'typing-bounce 1.2s infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
