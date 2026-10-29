import { Component, type ReactNode } from 'react';

export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <div role="alert" className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Stranica se nije učitala</h1>
            <p>Molimo pokušajte ponovo. Ako se problem ponavlja, kontaktirajte podršku.</p>
            <button onClick={() => window.location.reload()} className="bg-pius text-black px-6 py-3 rounded-lg">Pokušaj ponovo</button>
            <p><a href="mailto:info@pius-academy.com" className="text-pius underline">Kontaktiraj podršku</a></p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
