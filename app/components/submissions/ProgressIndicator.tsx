interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              currentStep > 1 
                ? "bg-green-500 text-white" 
                : currentStep === 1 
                ? "bg-primary text-white" 
                : "bg-gray-300 text-gray-500"
            }`}>
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <span className={`text-sm font-medium ${
              currentStep > 1 
                ? "text-green-600" 
                : currentStep === 1 
                ? "text-primary" 
                : "text-gray-500"
            }`}>
              Base IRS Files
            </span>
          </div>
          <div className={`w-16 h-px ${currentStep > 1 ? "bg-green-500" : "bg-gray-300"}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              currentStep > 2 
                ? "bg-green-500 text-white" 
                : currentStep === 2 
                ? "bg-primary text-white" 
                : "bg-gray-300 text-gray-500"
            }`}>
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <span className={`text-sm font-medium ${
              currentStep > 2 
                ? "text-green-600" 
                : currentStep === 2 
                ? "text-primary" 
                : "text-gray-500"
            }`}>
              Broker Details
            </span>
          </div>
          <div className={`w-16 h-px ${currentStep > 2 ? "bg-green-500" : "bg-gray-300"}`}></div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              currentStep === 3 
                ? "bg-primary text-white" 
                : "bg-gray-300 text-gray-500"
            }`}>
              3
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 3 
                ? "text-primary" 
                : "text-gray-500"
            }`}>
              Manual Transactions
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 