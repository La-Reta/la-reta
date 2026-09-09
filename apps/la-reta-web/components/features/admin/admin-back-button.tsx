import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const AdminBackButton = () => {
  return (
    <Button variant="secondary" render={<Link href="/admin" />}>
      <ArrowLeftIcon />
      Admin
    </Button>
  );
};
