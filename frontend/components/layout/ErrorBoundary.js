import React, { Component } from 'react';

// Inline SVG Icons to avoid external dependency
const AlertTriangleIcon = ({ size = 48, color = '#dc3545', style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const RefreshCwIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

/**
 * React Error Boundary Component
 * Catches errors in child components and displays fallback UI
 * Logs errors to backend for monitoring
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to backend
    const errorId = this.generateErrorId();
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Send error to backend logging service
    this.logErrorToBackend(error, errorInfo, errorId);
  }

  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logErrorToBackend = async (error, errorInfo, errorId) => {
    try {
      const payload = {
        errorId,
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
      };

      // Send to backend logging endpoint
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        // Silently fail if logging fails
        console.error('Failed to log error to backend:', err);
      });
    } catch (err) {
      console.error('Error logging error:', err);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

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
            padding: '20px',
            backgroundColor: '#f8f9fa',
            direction: 'rtl',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '20px' }} aria-hidden="true">
              <AlertTriangleIcon
                size={48}
                color="#dc3545"
                style={{ marginBottom: '10px' }}
              />
            </div>

            <h1 style={{ fontSize: '28px', marginBottom: '10px', color: '#333' }}>
              حدث خطأ ما
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '20px',
                lineHeight: '1.6',
              }}
            >
              عذراً، حدث خطأ غير متوقع في التطبيق. يرجى محاولة مجدداً أو التواصل مع
              الدعم الفني.
            </p>

            {this.state.errorId && (
              <div
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#666',
                  direction: 'ltr',
                }}
              >
                <strong>معرف الخطأ:</strong> {this.state.errorId}
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginBottom: '20px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: 'bold', color: '#856404' }}>
                  تفاصيل الخطأ (وضع التطوير فقط)
                </summary>
                <pre
                  style={{
                    marginTop: '10px',
                    overflow: 'auto',
                    backgroundColor: '#f5f5f5',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                aria-label="إعادة المحاولة"
              >
                <RefreshCwIcon size={18} />
                حاول مجدداً
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
                aria-label="الذهاب للصفحة الرئيسية"
              >
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
