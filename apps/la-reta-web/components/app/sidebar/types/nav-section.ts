export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  hint?: string;
  onlyAdmin?: boolean;
  subItems?: NavItem[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};
