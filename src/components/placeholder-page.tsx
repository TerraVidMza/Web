import { Construction } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Construction className="size-8" />
          <p className="text-sm">Esta sección está en construcción.</p>
        </CardContent>
      </Card>
    </div>
  )
}
