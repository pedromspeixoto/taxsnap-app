"use client"

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Logo from "@/app/components/ui/logo"

interface Transaction {
  id: string
  symbol: string
  type: "buy" | "sell"
  quantity: number
  price: number
  date: string
  platform: string
}

interface Dividend {
  id: string
  country: string
  amount: number
  currency: string
}

export default function SubmissionPreview() {
  // Mock data - in a real app, this would come from props or an API
  const transactions: Transaction[] = [
    { id: "1", symbol: "AAPL", type: "buy", quantity: 10, price: 150.0, date: "2024-01-15", platform: "DEGIRO" },
    { id: "2", symbol: "AAPL", type: "sell", quantity: 8, price: 165.0, date: "2024-02-20", platform: "DEGIRO" },
    { id: "3", symbol: "TSLA", type: "buy", quantity: 5, price: 200.0, date: "2024-01-10", platform: "Trading 212" },
    { id: "4", symbol: "TSLA", type: "sell", quantity: 5, price: 190.0, date: "2024-03-15", platform: "Trading 212" },
    {
      id: "5",
      symbol: "MSFT",
      type: "buy",
      quantity: 12,
      price: 300.0,
      date: "2024-02-01",
      platform: "Interactive Brokers",
    },
    {
      id: "6",
      symbol: "MSFT",
      type: "sell",
      quantity: 6,
      price: 320.0,
      date: "2024-03-10",
      platform: "Interactive Brokers",
    },
  ]

  const dividends: Dividend[] = [
    { id: "1", country: "USA", amount: 210, currency: "EUR" },
    { id: "2", country: "Germany", amount: 80, currency: "EUR" },
    { id: "3", country: "Portugal", amount: 30, currency: "EUR" },
  ]

  // Calculate summary data
  const stockSummary = transactions.reduce(
    (acc, transaction) => {
      const existing = acc.find((item) => item.symbol === transaction.symbol)
      if (existing) {
        if (transaction.type === "buy") {
          existing.totalBuys += transaction.quantity
        } else {
          existing.totalSells += transaction.quantity
        }
      } else {
        acc.push({
          symbol: transaction.symbol,
          totalBuys: transaction.type === "buy" ? transaction.quantity : 0,
          totalSells: transaction.type === "sell" ? transaction.quantity : 0,
          realizedPL: Math.floor(Math.random() * 2000) - 1000, // Mock P&L
        })
      }
      return acc
    },
    [] as Array<{ symbol: string; totalBuys: number; totalSells: number; realizedPL: number }>,
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/new-submission">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Logo />
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction Overview</h1>
          <p className="text-muted-foreground">Review your processed transactions</p>
        </div>

        {/* Stock Summary */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
            <CardDescription>Overview of your stock transactions and realized P&L</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock Symbol</TableHead>
                  <TableHead>Total Buys</TableHead>
                  <TableHead>Total Sells</TableHead>
                  <TableHead>Realized P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockSummary.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.totalBuys}</TableCell>
                    <TableCell>{stock.totalSells}</TableCell>
                    <TableCell className={stock.realizedPL >= 0 ? "text-green-600" : "text-red-600"}>
                      €{stock.realizedPL > 0 ? "+" : ""}
                      {stock.realizedPL}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dividends */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Dividends by Country</CardTitle>
            <CardDescription>Total dividends received by country</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Total Dividends (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividends.map((dividend) => (
                  <TableRow key={dividend.id}>
                    <TableCell className="font-medium">{dividend.country}</TableCell>
                    <TableCell>€{dividend.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* All Transactions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>Detailed view of all processed transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Platform</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "buy" ? "default" : "secondary"}>
                        {transaction.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>${transaction.price.toFixed(2)}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.platform}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
