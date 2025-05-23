export const buttonVariants = (variant: string) => {
  const variants: Record<string, string> = {
    primary: "bg-fg text-bg hover:bg-fg-muted",
    fancy: "fancy-border",
    outline: "border bg-transparent text-fg hover:bg-bg-muted",
    ghost: "bg-transparent text-fg hover:bg-bg-muted",
    destructive: "border-error text-error border hover:bg-error/10",
  };

  return variants[variant] || variants.primary;
};
