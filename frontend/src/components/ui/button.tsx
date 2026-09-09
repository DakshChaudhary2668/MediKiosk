"use client";
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export type ButtonVariant = "default" | "primary" | "secondary" | "danger" | "ghost" | "outline";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", children, className = "", style, disabled, ...props }, ref) => {
    const sizeStyle = {
      sm: { height: 32, padding: "0 12px", fontSize: 13 },
      md: { height: 40, padding: "0 16px", fontSize: 14 },
      lg: { height: 48, padding: "0 24px", fontSize: 15 },
    }[size];

    const variantCls = {
      default: "mk-btn-primary",
      primary: "mk-btn-primary",
      secondary: "mk-btn-secondary",
      danger: "mk-btn-danger",
      ghost: "mk-btn-ghost",
      outline: "mk-btn-secondary",
    }[variant];

    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className={`mk-btn ${variantCls} ${className}`}
        disabled={disabled}
        style={{
          ...sizeStyle,
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
