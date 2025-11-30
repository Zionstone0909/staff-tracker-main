import { FC, ReactNode } from "react"

interface AlertProps {
  variant?: "default" | "destructive"
  children: ReactNode
  className?: string
}

interface AlertDescriptionProps {
  children: ReactNode
  className?: string
}

export const Alert: FC<AlertProps> = ({ variant = "default", children, className }) => {
  const baseClasses = "rounded-md border p-4"
  const variantClasses =
    variant === "destructive"
      ? "bg-red-50 border-red-500 text-red-700"
      : "bg-blue-50 border-blue-300 text-blue-700"

  return <div className={`${baseClasses} ${variantClasses} ${className ?? ""}`}>{children}</div>
}

export const AlertDescription: FC<AlertDescriptionProps> = ({ children, className }) => {
  return <p className={`text-sm ${className ?? ""}`}>{children}</p>
}
