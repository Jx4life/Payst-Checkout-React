import { useSearchParams } from 'react-router-dom'
import CheckoutForm from '../components/CheckoutForm'

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  
  const merchant = searchParams.get('merchant') || ''
  const orderId = searchParams.get('orderId') || `ORDER-${Date.now()}`
  const amount = searchParams.get('amount') || '100'

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <CheckoutForm 
        merchant={merchant}
        orderId={orderId}
        amount={amount}
      />
    </main>
  )
}