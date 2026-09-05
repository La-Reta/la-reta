"use client";

import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export const BackButton = ({
  children,
  ...buttonProps
}: {
  readonly children?: React.ReactNode;
  readonly buttonProps?: React.ComponentProps<typeof Button>;
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    router.back();
  };

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      variant="secondary"
      size="default"
      className={cn("min-w-24", buttonProps.buttonProps?.className)}
    >
      {children ?? (
        <>
          <ArrowLeftIcon /> Atrás
        </>
      )}
    </Button>
  );
};
