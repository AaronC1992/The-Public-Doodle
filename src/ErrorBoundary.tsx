import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <h1 style={{ fontSize: '2rem' }}>🎨 Oops, something went wrong</h1>
          <p style={{ color: '#666', maxWidth: '480px' }}>
            The doodle app ran into an unexpected error. You can try refreshing the page or clicking
            the button below to recover.
          </p>
          {this.state.error ? (
            <pre
              style={{
                background: '#f5f5f5',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                maxWidth: '600px',
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '0.6rem 1.4rem',
              background: '#2979ff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.4rem',
              background: 'transparent',
              color: '#2979ff',
              border: '1px solid #2979ff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
