import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Ubicacion } from "./ubicacion"

describe("Ubicacion (W-028)", () => {
  it("sin coordenadas muestra un guion", () => {
    render(<Ubicacion latitud={null} longitud={undefined} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("con coordenadas enlaza a OpenStreetMap", () => {
    render(<Ubicacion latitud={-33.1} longitud={-68.2} />)
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/?mlat=-33.1&mlon=-68.2#map=17/-33.1/-68.2"
    )
  })
})
