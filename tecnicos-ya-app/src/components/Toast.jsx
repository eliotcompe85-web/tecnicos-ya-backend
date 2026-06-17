export default function Toast({ toast }) {
  if (!toast) return null

  return (
    <div
      className="toast"
      style={
        toast.type === 'error'
          ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }
          : {}
      }
    >
      {toast.type === 'error' ? '❌ ' : '✅ '}{toast.msg}
    </div>
  )
}
