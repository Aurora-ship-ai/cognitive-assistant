import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          {
            primary:
              "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
            secondary:
              "bg-[var(--muted-bg)] text-[var(--foreground)] hover:bg-[var(--border)]",
            ghost:
              "text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]",
            danger:
              "bg-red-600 text-white hover:bg-red-700",
          }[variant],
          {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
          }[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps };
