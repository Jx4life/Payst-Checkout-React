import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACT_ADDRESS, CHECKOUT_ABI, ERC20_ABI, TOKENS } from '../lib/contracts'
import { ARC_TESTNET } from '../lib/wagmi-config'

export default function CheckoutForm({ merchant, orderId, amount }) {
  const { address, isConnected } = useAccount()
  const [selectedCurrency, setSelectedCurrency] = useState('USDC')
  const [status, setStatus] = useState(null)
  const [merchantPaymentAddress, setMerchantPaymentAddress] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [successTxHash, setSuccessTxHash] = useState('')

  // Calculate amounts
  const baseAmount = parseFloat(amount)
  const fee = baseAmount * 0.002
  const total = baseAmount + fee
  const amountWei = parseUnits(total.toFixed(2), 6)

  // Get merchant payment address
  const { data: merchantData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHECKOUT_ABI,
    functionName: 'getMerchantPaymentAddress',
    args: [merchant],
    chainId: ARC_TESTNET.id,
  })

  useEffect(() => {
    if (merchantData) {
      setMerchantPaymentAddress(merchantData)
    }
  }, [merchantData])

  // Check token allowance
  const { data: allowanceData } = useReadContract({
    address: TOKENS[selectedCurrency],
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    chainId: ARC_TESTNET.id,
  })

  // Check token balance
  const { data: balanceData } = useReadContract({
    address: TOKENS[selectedCurrency],
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET.id,
  })

  // Approve contract
  const { writeContract: approveToken, data: approveData } = useWriteContract()
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveData })

  // Process payment
  const { writeContract: processPayment, data: paymentData } = useWriteContract()
  const { isLoading: isProcessing, isSuccess: isPaymentSuccess } = useWaitForTransactionReceipt({ hash: paymentData })

  useEffect(() => {
    if (isPaymentSuccess && paymentData) {
      setPaymentSuccess(true)
      setSuccessTxHash(paymentData)
    }
  }, [isPaymentSuccess, paymentData])

  const handleApprove = async () => {
    try {
      setStatus({ message: 'Requesting token approval...', type: 'info' })
      approveToken({
        address: TOKENS[selectedCurrency],
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountWei],
        chainId: ARC_TESTNET.id,
      })
    } catch (error) {
      setStatus({ message: error.message || 'Approval failed', type: 'error' })
    }
  }

  const handlePayment = async () => {
    try {
      if (balanceData && BigInt(balanceData.toString()) < amountWei) {
        setStatus({ message: `Insufficient ${selectedCurrency} balance`, type: 'error' })
        return
      }

      const currentAllowance = allowanceData ? BigInt(allowanceData.toString()) : BigInt(0)
      if (currentAllowance < amountWei) {
        await handleApprove()
        return
      }

      setStatus({ message: 'Processing payment...', type: 'info' })
      processPayment({
        address: CONTRACT_ADDRESS,
        abi: CHECKOUT_ABI,
        functionName: 'processPayment',
        args: [merchant, TOKENS[selectedCurrency], amountWei, orderId],
        chainId: ARC_TESTNET.id,
      })
    } catch (error) {
      setStatus({ message: error.message || 'Payment failed', type: 'error' })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">🔐 Secure Crypto Payment</h1>
          <p className="opacity-90">Fast, secure stablecoin checkout</p>
        </div>
        
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-6">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-3">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">Your payment has been confirmed on the blockchain</p>
          <p className="font-semibold text-gray-900 mb-6">Order #{orderId}</p>
          
          <a
            href={`https://testnet.arcscan.app/tx/${successTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-gray-100 text-purple-600 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            View Transaction →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg w-full">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">🔐 Secure Crypto Payment</h1>
          <p className="opacity-90">Fast, secure stablecoin checkout</p>
        </div>

        <div className="p-8">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Order Details</h3>
            
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (0.2%):</span>
                <span className="font-medium">${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 font-semibold text-base">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center mb-6">
            <ConnectButton />
          </div>

          {/* Currency Selection - Only show when connected */}
          {isConnected && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Payment Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedCurrency('USDC')}
                  className={`p-4 rounded-xl border-2 transition text-center ${
                    selectedCurrency === 'USDC' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">💵</div>
                  <div className="font-semibold">USDC</div>
                </button>
                <button
                  onClick={() => setSelectedCurrency('EURC')}
                  className={`p-4 rounded-xl border-2 transition text-center ${
                    selectedCurrency === 'EURC' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">💶</div>
                  <div className="font-semibold">EURC</div>
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-xl border-l-4 mb-6 ${
              status.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-700' :
              status.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
              'bg-red-50 border-red-500 text-red-700'
            }`}>
              {status.message}
            </div>
          )}

          {/* Payment Button - Only show when connected */}
          {isConnected && (
            <button
              onClick={handlePayment}
              disabled={isApproving || isProcessing || !merchant}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 mb-6"
            >
              {isApproving ? 'Approving...' : isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </button>
          )}

          {/* Manual Payment Section */}
          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="text-center font-semibold text-gray-700 mb-4">Or use External Wallet</h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-4">📤 Send Payment from Your Wallet</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Merchant Address</div>
                  <div className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <span className="font-mono text-xs break-all">{merchantPaymentAddress || 'Loading...'}</span>
                    <button
                      onClick={() => copyToClipboard(merchantPaymentAddress)}
                      className="ml-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Amount to Send</div>
                  <div className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold">${total.toFixed(2)}</span>
                    <button
                      onClick={() => copyToClipboard(total.toFixed(2))}
                      className="ml-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Token</div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="font-semibold">{selectedCurrency}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Order Reference</div>
                  <div className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <span className="font-mono text-xs">{orderId}</span>
                    <button
                      onClick={() => copyToClipboard(orderId)}
                      className="ml-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mt-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Send the exact amount to the merchant address. Keep your Order ID for reference.
              </p>
            </div>
          </div>

          <div className="text-center text-gray-500 text-xs mt-6">
            Secured by blockchain technology
          </div>
        </div>
      </div>

      <div className="text-center text-white mt-5 opacity-90">
        Powered by <span className="font-semibold">Payst Checkout</span>
      </div>
    </div>
  )
}