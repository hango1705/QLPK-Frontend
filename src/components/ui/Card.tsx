import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "elevated" | "outlined" | "filled"
  padding?: "none" | "sm" | "md" | "lg" | "xl"
  hoverable?: boolean
}

function Card({ 
  className, 
  variant = "default",
  padding = "md",
  hoverable = false,
  ...props 
}: CardProps) {
  const variantClasses = {
    default: "bg-card text-card-foreground border shadow-sm",
    elevated: "bg-card text-card-foreground border shadow-md",
    outlined: "bg-card text-card-foreground border-2",
    filled: "bg-muted text-foreground border",
  }

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "py-6",
    lg: "p-6",
    xl: "p-8",
  }

  const CardComponent = hoverable ? motion.div : 'div';
  const motionProps = hoverable ? {
    whileHover: { 
      scale: 1.02,
      y: -4,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        mass: 0.5
      }
    },
    whileTap: { 
      scale: 0.98,
      transition: { 
        type: "spring", 
        stiffness: 600, 
        damping: 20 
      }
    },
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25,
      opacity: { duration: 0.2 }
    }
  } : {};

  return (
    <CardComponent
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl",
        variantClasses[variant],
        paddingClasses[padding],
        hoverable && "cursor-pointer transition-shadow",
        className
      )}
      {...(hoverable ? motionProps : {})}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

export type { CardProps }
