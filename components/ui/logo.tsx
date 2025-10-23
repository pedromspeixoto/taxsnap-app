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
    sm: { width: 100, height: 32 },
    md: { width: 120, height: 38 },
    lg: { width: 140, height: 44 }
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
        {/* "IRSimples" text */}
        <text 
          x="50" 
          y="24" 
          fontFamily="Arial, sans-serif" 
          fontWeight="bold" 
          fill="#22c55e" 
          textAnchor="middle"
        >
          <tspan fontSize="24">IRS</tspan>
          <tspan fontSize="20" fontWeight="normal">imples</tspan>
        </text>
      </svg>
    </div>
  )
}
