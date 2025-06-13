"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { ArrowLeft, Edit2, Save, X } from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: string
  symbol: string
  type: "buy" | "sell"
  quantity: number
  price: number
  date: string
  platform: string
  editable?: boolean
}

interface Dividend {
  id: string
  country: string
  amount: number
  currency: string
  editable?: boolean
}

export default function SubmissionPreview() {
  const [transactions, setTransactions] = useState<Transaction[]>([
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
  ])

  const [dividends, setDividends] = useState<Dividend[]>([
    { id: "1", country: "USA", amount: 210, currency: "EUR" },
    { id: "2", country: "Germany", amount: 80, currency: "EUR" },
    { id: "3", country: "Portugal", amount: 30, currency: "EUR" },
  ])

  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [editingDividend, setEditingDividend] = useState<string | null>(null)

  const handleEditTransaction = (id: string) => {
    setEditingTransaction(id)
  }

  const handleSaveTransaction = () => {
    setEditingTransaction(null)
  }

  const handleEditDividend = (id: string) => {
    setEditingDividend(id)
  }

  const handleSaveDividend = () => {
    setEditingDividend(null)
  }

  const updateTransaction = (id: string, field: keyof Transaction, value: string | number) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const updateDividend = (id: string, field: keyof Dividend, value: string | number) => {
    setDividends((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold">Taxsnap</span>
            </div>
          </div>
          <Button>Save Submission</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction Overview</h1>
          <p className="text-muted-foreground">Review and edit your processed transactions</p>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividends.map((dividend) => (
                  <TableRow key={dividend.id}>
                    <TableCell className="font-medium">{dividend.country}</TableCell>
                    <TableCell>
                      {editingDividend === dividend.id ? (
                        <Input
                          type="number"
                          value={dividend.amount}
                          onChange={(e) => updateDividend(dividend.id, "amount", Number(e.target.value))}
                          className="w-24"
                        />
                      ) : (
                        `€${dividend.amount}`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingDividend === dividend.id ? (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleSaveDividend()}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDividend(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditDividend(dividend.id)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
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
                  <TableHead>Actions</TableHead>
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
                    <TableCell>
                      {editingTransaction === transaction.id ? (
                        <Input
                          type="number"
                          value={transaction.quantity}
                          onChange={(e) => updateTransaction(transaction.id, "quantity", Number(e.target.value))}
                          className="w-20"
                        />
                      ) : (
                        transaction.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingTransaction === transaction.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={transaction.price}
                          onChange={(e) => updateTransaction(transaction.id, "price", Number(e.target.value))}
                          className="w-24"
                        />
                      ) : (
                        `$${transaction.price.toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.platform}</TableCell>
                    <TableCell>
                      {editingTransaction === transaction.id ? (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleSaveTransaction()}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTransaction(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditTransaction(transaction.id)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
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
