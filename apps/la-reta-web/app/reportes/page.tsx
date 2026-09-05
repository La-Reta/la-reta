import { ReportForm } from "@/components/features/reports/report-form";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlertIcon } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Reportar · Reta Fútbol" };

const ReportsPage = () => {
  return (
    <div className="mx-auto max-w-3xl min-w-0 space-y-6 xl:container">
      <PageHeader
        title="Reportar o pedir ayuda"
        description="Usa este espacio para avisar problemas, errores, dudas sensibles o solicitudes relacionadas con privacidad, imagen o datos."
      />

      <Alert>
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
};

export default ReportsPage;
