import { describe, expect, it } from "vitest"
import { Route, Routes } from "react-router-dom"
import { LoginPage } from "./login-page"
import { ProtectedRoute } from "@/routes/protected-route"
import { leerSesion } from "@/auth/sesion"
import { renderConProveedores, screen, waitFor } from "@/test/utils"

function Destino({ texto }: { texto: string }) {
  return <p>{texto}</p>
}

/** Login, layout mínimo y una ruta protegida, para probar el ida y vuelta. */
function AppDePrueba() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Destino texto="Estoy en el inicio" />} />
        <Route path="/fincas" element={<Destino texto="Estoy en fincas" />} />
        <Route path="/cambiar-password" element={<Destino texto="Cambiá tu contraseña" />} />
      </Route>
    </Routes>
  )
}

describe("Login", () => {
  it("guarda token y usuario en una sola clave y entra al sistema", async () => {
    const { usuario } = renderConProveedores(<AppDePrueba />, { ruta: "/login" })

    await usuario.type(screen.getByLabelText(/email/i), "propietario@terravid.demo")
    await usuario.type(screen.getByLabelText(/contraseña/i), "correcta1")
    await usuario.click(screen.getByRole("button", { name: /iniciar sesión/i }))

    expect(await screen.findByText("Estoy en el inicio")).toBeInTheDocument()

    const sesion = leerSesion()
    expect(sesion?.accessToken).toBeTruthy()
    expect(sesion?.user.rol).toBe("Propietario")
    // Una sola clave: token y usuario no pueden desincronizarse.
    expect(localStorage.getItem("terravid.accessToken")).toBeNull()
    expect(localStorage.getItem("terravid.user")).toBeNull()
  })

  it("muestra el error del backend sin expulsar de la pantalla", async () => {
    const { usuario } = renderConProveedores(<AppDePrueba />, { ruta: "/login" })

    await usuario.type(screen.getByLabelText(/email/i), "propietario@terravid.demo")
    await usuario.type(screen.getByLabelText(/contraseña/i), "equivocada1")
    await usuario.click(screen.getByRole("button", { name: /iniciar sesión/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/Email o contraseña incorrectos/i)
    // El 401 del propio login no es una sesión que expiró: el interceptor no
    // debe tratarlo como tal ni sacar al usuario del formulario.
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it("vuelve a la página que el usuario quería abrir", async () => {
    const { usuario } = renderConProveedores(<AppDePrueba />, { ruta: "/fincas" })

    // La ruta protegida redirige al login guardando el `from`…
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument())

    await usuario.type(screen.getByLabelText(/email/i), "propietario@terravid.demo")
    await usuario.type(screen.getByLabelText(/contraseña/i), "correcta1")
    await usuario.click(screen.getByRole("button", { name: /iniciar sesión/i }))

    // …y el login lo respeta. Antes se calculaba el `from` y después se
    // navegaba a "/" igual, así que el redirect estaba muerto.
    expect(await screen.findByText("Estoy en fincas")).toBeInTheDocument()
  })

  it("manda a cambiar la contraseña cuando es temporal", async () => {
    const { usuario } = renderConProveedores(<AppDePrueba />, { ruta: "/login" })

    await usuario.type(screen.getByLabelText(/email/i), "temporal@terravid.demo")
    await usuario.type(screen.getByLabelText(/contraseña/i), "correcta1")
    await usuario.click(screen.getByRole("button", { name: /iniciar sesión/i }))

    expect(await screen.findByText("Cambiá tu contraseña")).toBeInTheDocument()
  })

  it("ofrece el enlace de recuperación (HU-03)", () => {
    renderConProveedores(<AppDePrueba />, { ruta: "/login" })
    expect(screen.getByRole("link", { name: /olvidé mi contraseña/i })).toHaveAttribute(
      "href",
      "/olvide-mi-password"
    )
  })
})
