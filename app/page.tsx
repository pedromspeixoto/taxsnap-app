import { redirect } from 'next/navigation'

// This is a temporary redirect page for the root route
// Users will be redirected to their preferred locale by middleware
export default function RootPage() {
  // This should never be reached due to middleware redirect
  // But if it is, redirect to default locale
  redirect('/pt')
}
