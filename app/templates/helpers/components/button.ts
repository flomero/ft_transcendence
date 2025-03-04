export const buttonVariants = (variant: string) => {
  const variants: Record<string, string> = {
    primary: "bg-fg text-bg hover:bg-fg-muted",
    fancy: "fancy-border",
    outline: "border bg-transparent text-fg hover:bg-bg-muted",
  };

  return variants[variant] || variants["primary"];
};
