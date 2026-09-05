"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

const Collapsible = ({ ...props }: CollapsiblePrimitive.Root.Props) => {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
};

const CollapsibleTrigger = ({
  nativeButton,
  render,
  ...props
}: CollapsiblePrimitive.Trigger.Props) => {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      // MODIFICADO respecto a shadcn, igual que components/ui/button.tsx: con
      // `render` (p. ej. <CollapsibleTrigger render={<CardHeader/>}/>) el
      // elemento final es un <div>, y Base UI avisa en consola si `nativeButton`
      // sigue en true. En false añade role/tabIndex y teclado al elemento.
      // Conservar al regenerar el componente.
      nativeButton={nativeButton ?? render == null}
      render={render}
      {...props}
    />
  );
};

const CollapsibleContent = ({ ...props }: CollapsiblePrimitive.Panel.Props) => {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
