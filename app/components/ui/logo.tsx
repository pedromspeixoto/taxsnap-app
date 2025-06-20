import { cn } from "@/lib/utils/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export default function Logo({ 
  size = "md", 
  showText = true, 
  className 
}: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  }

  const iconTextSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "bg-primary rounded-full flex items-center justify-center",
        sizeClasses[size]
      )}>
        <span className={cn(
          "text-primary-foreground font-bold",
          iconTextSizeClasses[size]
        )}>
          T
        </span>
      </div>
      {showText && (
        <span className={cn(
          "font-bold",
          textSizeClasses[size]
        )}>
          Taxsnap
        </span>
      )}
    </div>
  )
} 