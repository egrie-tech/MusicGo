import { Component } from 'react'
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err, info) { console.error('App crash:', err, info) }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 20, color: '#fca5a5', background: '#0a0a14', minHeight: '100vh', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#f87171' }}>Something crashed</h2>
          <p>{String(this.state.err && this.state.err.stack || this.state.err)}</p>
          <button onClick={() => location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: '#a855f7', color: 'white', border: 'none', borderRadius: 8 }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}
