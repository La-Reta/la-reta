import { ReportForm } from "@/components/features/reports/report-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlertIcon } from "lucide-react";

export const metadata = { title: "Reportar · Reta Fútbol" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Reportar o pedir ayuda
        </h1>
        <p className="text-muted-foreground text-sm">
          Usa este espacio para avisar problemas, errores, dudas sensibles o
          solicitudes relacionadas con privacidad, imagen o datos.
        </p>
      </div>

      <Alert className="bg-card">
        <ShieldAlertIcon />
        <AlertTitle>Canal privado de revisión</AlertTitle>
        <AlertDescription>
          Los reportes solo son visibles para administradores. Si hay una
          urgencia fuera de la app, contacta directamente a una persona
          responsable de la reta.
        </AlertDescription>
      </Alert>

      <ReportForm />
    </div>
  );
}
