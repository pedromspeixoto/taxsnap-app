"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Crown, Zap } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { checkSubmissionCapabilityAction } from "@/app/actions/payment-actions"
import type { TranslationHelper } from "@/lib/utils/get-translations"

interface TierSelectionModalProps {
  children: React.ReactNode
  onTierSelect: (tier: 'PREMIUM' | 'STANDARD') => void
  t?: TranslationHelper | null
}

interface SubmissionCapability {
  canCreate: boolean
  tier: 'STANDARD' | 'PREMIUM'
  hasPremiumSubscriptions: boolean
  hasOnlyPremium: boolean
  hasOnlyStandard: boolean
  hasMixedSubscriptions: boolean
}

export function TierSelectionModal({ children, onTierSelect, t }: TierSelectionModalProps) {
  const [open, setOpen] = useState(false)
  const [capability, setCapability] = useState<SubmissionCapability | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { getValidAccessToken } = useAuth()

  const fetchCapability = async () => {
    try {
      setIsLoading(true)
      const accessToken = await getValidAccessToken()
      const result = await checkSubmissionCapabilityAction(accessToken)
      
      if (!result.error && result.success) {
        setCapability({
          canCreate: result.canCreate || false,
          tier: result.tier || 'STANDARD',
          hasPremiumSubscriptions: result.hasPremiumSubscriptions || false,
          hasOnlyPremium: result.hasOnlyPremium || false,
          hasOnlyStandard: result.hasOnlyStandard || false,
          hasMixedSubscriptions: result.hasMixedSubscriptions || false
        })
      }
    } catch (error) {
      console.error('Error fetching capability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      await fetchCapability()
      
      // Auto-handle single tier scenarios
      if (capability?.hasOnlyPremium) {
        onTierSelect('PREMIUM')
        return
      }
      if (capability?.hasOnlyStandard) {
        onTierSelect('STANDARD')
        return
      }
    }
    
    setOpen(newOpen)
  }

  const handleTierSelect = (tier: 'PREMIUM' | 'STANDARD') => {
    onTierSelect(tier)
    setOpen(false)
  }

  // Auto-select when capability loads and there's only one option
  useEffect(() => {
    if (capability && open) {
      if (capability.hasOnlyPremium) {
        onTierSelect('PREMIUM')
        setOpen(false)
      } else if (capability.hasOnlyStandard) {
        onTierSelect('STANDARD') 
        setOpen(false)
      }
    }
  }, [capability, open, onTierSelect])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-semibold">
            {t?.t('modal.tierSelection.title') || 'Choose Submission Type'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {t?.t('modal.tierSelection.description') || 'Select how you want your tax submission to be processed.'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">
              {t?.t('modal.tierSelection.loadingOptions') || 'Loading options...'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Premium Option */}
            {capability?.hasPremiumSubscriptions && (
              <div 
                className="group relative rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/50 dark:border-gray-700 dark:hover:border-yellow-500 dark:hover:bg-yellow-950/30 cursor-pointer transition-all duration-200"
                onClick={() => handleTierSelect('PREMIUM')}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <Crown className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t?.t('modal.tierSelection.premium.title') || 'Premium Submission'}
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          {t?.t('modal.tierSelection.premium.manualReview') || 'Personalized manual review from certified accountants'}
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          {t?.t('modal.tierSelection.premium.priorityProcessing') || 'Priority processing'}
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          {t?.t('modal.tierSelection.premium.expertVerification') || 'Expert verification'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Option */}
            {(!capability?.hasOnlyPremium) && (
              <div 
                className="group relative rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 cursor-pointer transition-all duration-200"
                onClick={() => handleTierSelect('STANDARD')}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t?.t('modal.tierSelection.standard.title') || 'Standard Submission'}
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {t?.t('modal.tierSelection.standard.automatedCalculation') || 'Automated tax calculation'}
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {t?.t('modal.tierSelection.standard.fastProcessing') || 'Fast processing'}
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {t?.t('modal.tierSelection.standard.reliableResults') || 'Reliable results'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
