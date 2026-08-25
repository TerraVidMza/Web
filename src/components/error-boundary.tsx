import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Red de contención para errores de render.
 *
 * Sin esto, cualquier excepción durante el render desmonta el árbol entero y
 * deja **una pantalla en blanco**, sin mensaje y sin forma de volver: el modo
 * de falla más caro de diagnosticar, porque no deja rastro visible.
 *
 * Tiene que ser una clase: los hooks no pueden capturar errores de render.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error no capturado en el árbol de React:", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="size-10 text-destructive" aria-hidden="true" />
        <div role="alert" className="space-y-2">
          <h1 className="text-lg font-semibold">Algo se rompió</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            La pantalla no pudo dibujarse. Podés recargar para volver a intentarlo; si
            vuelve a pasar, avisá al equipo técnico con el detalle de abajo.
          </p>
        </div>
        <pre className="max-w-xl overflow-x-auto rounded-md bg-muted p-3 text-left text-xs">
          {this.state.error.message}
        </pre>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            Reintentar
          </Button>
          <Button onClick={() => window.location.assign("/")}>Volver al inicio</Button>
        </div>
      </div>
    )
  }
}
