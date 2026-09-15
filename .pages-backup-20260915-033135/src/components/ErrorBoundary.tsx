/**
 * Application error boundary.
 *
 * A crashed render must not become a blank dark screen — in a clinic that is
 * indistinguishable from a dead app. It shows an Arabic message and a way
 * back, and logs the technical detail to the console only.
 *
 * The stack is shown in development only. Patients must never see a raw
 * error, and a stack trace can leak table and column names.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[iapp] render error', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="centered">
        <h1 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>حدث خطأ غير متوقع</h1>
        <p className="muted" style={{ maxWidth: 380 }}>
          تعذّر عرض هذه الصفحة. لم يتم فقدان أي بيانات. أعد التحميل، وإن تكرّر الخطأ
          استخدم النسخة السابقة من التطبيق.
        </p>
        <button className="btn" onClick={this.reset}>
          إعادة التحميل
        </button>
        {import.meta.env.DEV ? (
          <pre
            style={{
              maxWidth: '100%',
              overflow: 'auto',
              direction: 'ltr',
              textAlign: 'left',
              fontSize: 11,
              color: 'var(--muted)',
            }}
          >
            {error.stack ?? error.message}
          </pre>
        ) : null}
      </div>
    );
  }
}
