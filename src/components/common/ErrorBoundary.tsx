import { Component, type ErrorInfo, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('UI error:', error, info.componentStack) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center bg-brand-bg p-6 text-center"><div><h1 className="text-2xl font-extrabold">Something went wrong</h1><p className="mt-2 text-slate-600">An unexpected error occurred. Please refresh the page.</p><button className="btn-primary mt-4" onClick={() => window.location.assign('/')}>Back to home</button></div></div>
    )
  }
}
