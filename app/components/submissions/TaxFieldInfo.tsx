"use client"

import { useState } from "react"
import { Info, X, ExternalLink } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface TaxFieldInfoProps {
  fieldType: 'total_stocks_pl' | 'total_dividends_gross' | 'dividend_taxes' | 'total_acquisition' | 'total_realized' | 'trade_expenses'
  className?: string
}

const fieldDescriptions = {
  total_stocks_pl: {
    title: "Total Stocks P&L",
    description: "This represents your total profit or loss from stock trading. A positive value means you made a profit, but capital gains taxes must be paid on profitable trades. Losses can be used to offset gains for tax purposes.",
    learnMoreUrl: "https://www.gov.uk/tax-on-dividends"
  },
  total_dividends_gross: {
    title: "Total Dividends (Gross)",
    description: "This is the total amount of dividends you received before any taxes were deducted. Dividends are subject to income tax and may also have withholding taxes from foreign countries.",
    learnMoreUrl: "https://www.gov.uk/tax-on-dividends"
  },
  dividend_taxes: {
    title: "Dividend Taxes",
    description: "This shows the total amount of taxes withheld from your dividends by foreign countries. These withholding taxes can often be claimed as tax credits to reduce your domestic tax liability.",
    learnMoreUrl: "https://www.gov.uk/tax-on-dividends"
  },
  total_acquisition: {
    title: "Total Acquisition",
    description: "This is the total amount you spent purchasing stocks during the tax year. This includes the purchase price of shares but excludes trading fees and commissions.",
    learnMoreUrl: "https://www.gov.uk/capital-gains-tax"
  },
  total_realized: {
    title: "Total Realized",
    description: "This is the total amount you received from selling stocks during the tax year. This is the gross proceeds from your stock sales before deducting the original purchase price and expenses.",
    learnMoreUrl: "https://www.gov.uk/capital-gains-tax"
  },
  trade_expenses: {
    title: "Trade Expenses",
    description: "These are the fees and commissions you paid for buying and selling stocks. These expenses can be deducted from your capital gains to reduce your taxable amount.",
    learnMoreUrl: "https://www.gov.uk/capital-gains-tax"
  }
}

export default function TaxFieldInfo({ fieldType, className = "" }: TaxFieldInfoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const info = fieldDescriptions[fieldType]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors ${className}`}
        title={`Learn more about ${info.title}`}
      >
        <Info className="w-4 h-4 text-gray-500 hover:text-gray-700" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{info.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 mb-4 leading-relaxed">
                {info.description}
              </CardDescription>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(info.learnMoreUrl, '_blank')}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Learn More
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Got it
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 