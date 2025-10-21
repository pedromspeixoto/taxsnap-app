import { cn } from "@/lib/utils/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ 
  size = "md", 
  className 
}: LogoProps) {
  const sizeMap = {
    sm: { width: 80, height: 28 },
    md: { width: 100, height: 32 },
    lg: { width: 120, height: 38 }
  }

  const dimensions = sizeMap[size]

  return (
    <div className={cn("flex items-center", className)}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 32" 
        width={dimensions.width}
        height={dimensions.height}
        className="transition-all"
      >
        {/* Background */}
        <rect width="100" height="32" rx="6" fill="#22c55e"/>
        
        {/* "IRSimples" text */}
        <text 
          x="50" 
          y="23" 
          fontFamily="Arial, sans-serif" 
          fontWeight="bold" 
          fill="#000000" 
          textAnchor="middle"
        >
          <tspan fontSize="18">IRS</tspan>
          <tspan fontSize="14" fontWeight="normal">imples</tspan>
        </text>
      </svg>
    </div>
  )
} 