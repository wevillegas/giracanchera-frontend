import { Component } from 'react';
import { C } from '../theme';

// Si algo falla al renderizar, muestra un mensaje en vez de dejar la pantalla en blanco
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error de render:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: C.bg, color: C.bright }}>
        <p className="text-lg">Algo salió mal al mostrar esta pantalla.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl text-sm font-semibold gc-focus"
          style={{ backgroundColor: C.brand, color: C.bright }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
