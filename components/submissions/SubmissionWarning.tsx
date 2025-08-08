import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SubmissionWarning() {
  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-8">
      <CardContent>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-3">
              Notes to consider on the report:
            </h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>
                  P&L calculation is based on a FIFO logic according to the Portuguese Law
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>
                  Some brokers do not share exchange rates nor the final transaction value in the account currency (EUR). In those cases we use the average exchange rate of the transaction day. This may cause minor fluctuation on values compared with the PDF financial reports from each broker at the end of the year
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                <span>
                  Reported dividends for tax purposes exclude portuguese dividends, as taxes for these are already fully retained by the broker
                </span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 