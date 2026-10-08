import { Component } from "react";
import { Link } from "react-router-dom";

// Catches render errors so a bug on one page shows a readable message
// instead of unmounting the whole app into a blank (black) screen.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page err-page">
        <div className="err-code" aria-hidden="true">!</div>
        <h1>משהו השתבש בטעינת הדף</h1>
        <p>אפשר לחזור לדף הבית ולנסות שוב. אם זה חוזר, שלחו לנו את הפרטים שמופיעים למטה.</p>
        <code className="err-detail">{String(this.state.error?.message || this.state.error)}</code>
        <div className="err-actions">
          <Link to="/" className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            חזרה לדף הבית
          </Link>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            רענון הדף
          </button>
        </div>
      </div>
    );
  }
}
