import { Component } from 'react'

// Si una página falla al dibujarse, muestra un mensaje en vez de dejar la
// pantalla en blanco. Es el único componente de clase del proyecto: React
// todavía no ofrece esta función (capturar errores de render) con hooks.
class LimiteDeErrores extends Component {
  state = { huboError: false }

  static getDerivedStateFromError() {
    return { huboError: true }
  }

  componentDidCatch(error, informacion) {
    console.error('Error inesperado al mostrar la página:', error, informacion)
  }

  render() {
    if (!this.state.huboError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Algo salió mal</h1>
        <p className="max-w-md text-slate-600">
          No pudimos mostrar esta página. Puede ser un problema de conexión o un error nuestro.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-brand-700 px-5 py-2.5 font-bold text-white transition hover:bg-brand-800">
            Volver a intentar
          </button>
          <a href="/" className="rounded-xl border border-neutral-300 px-5 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100">
            Ir al inicio
          </a>
        </div>
      </div>
    )
  }
}

export default LimiteDeErrores
