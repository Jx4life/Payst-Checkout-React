import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { isAddress } from 'viem'
import { CONTRACT_ADDRESS, CHECKOUT_ABI } from '../lib/contracts'
import { ARC_TESTNET } from '../lib/wagmi-config'

export default function MerchantRegister() {
  const { address, isConnected } = useAccount()
  const [paymentAddress, setPaymentAddress] = useState('')
  const [status, setStatus] = useState(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  // Check if already registered
  const { data: isMerchantData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHECKOUT_ABI,
    functionName: 'isMerchant',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET.id,
  })

  const { data: merchantData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHECKOUT_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET.id,
  })

  useEffect(() => {
    if (isConnected && address) {
      setPaymentAddress(address)
    }
  }, [isConnected, address])

  useEffect(() => {
    if (isMerchantData && merchantData) {
      const [merchantPaymentAddr] = merchantData
      setStatus({ message: '⚠️ This address is already registered as a merchant', type: 'info' })
      setPaymentAddress(merchantPaymentAddr)
    }
  }, [isMerchantData, merchantData])

  // Register merchant
  const { writeContract: registerMerchant, data: registerData } = useWriteContract()
  const { isLoading: isRegistering, isSuccess: isRegisterSuccess } = useWaitForTransactionReceipt({ 
    hash: registerData 
  })

  useEffect(() => {
    if (isRegisterSuccess && registerData) {
      setRegistrationSuccess(true)
      setTxHash(registerData)
    }
  }, [isRegisterSuccess, registerData])

  const handleRegister = async () => {
    if (!paymentAddress || !isAddress(paymentAddress)) {
      setStatus({ message: 'Please enter a valid payment address', type: 'error' })
      return
    }

    try {
      setStatus({ message: 'Submitting registration to blockchain...', type: 'info' })
      registerMerchant({
        address: CONTRACT_ADDRESS,
        abi: CHECKOUT_ABI,
        functionName: 'registerMerchant',
        args: [paymentAddress],
        chainId: ARC_TESTNET.id,
      })
    } catch (error) {
      setStatus({ message: error.message || 'Registration failed', type: 'error' })
    }
  }

  if (registrationSuccess) {
    return (
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-10 text-center">
          <h1 className="text-3xl font-bold mb-2">🏪 Merchant Registration</h1>
          <p className="opacity-90">Register to accept stablecoin payments</p>
        </div>
        
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-6">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-3">Registration Successful!</h2>
          <p className="text-gray-600 mb-8">Your merchant account is now active</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600 text-sm">Merchant Address:</span>
                <span className="font-mono text-sm font-semibold break-all text-right max-w-[60%]">{address}</span>
              </div>
              <div className="flex justify-between pb-3 border-b">
                <span className="text-gray-600 text-sm">Payment Address:</span>
                <span className="font-mono text-sm font-semibold break-all text-right max-w-[60%]">{paymentAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Platform Fee:</span>
                <span className="font-semibold text-sm">0.2%</span>
              </div>
            </div>
          </div>

          <a
            href={`https://testnet.arcscan.app/tx/${txHash}`}
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
    <div className="max-w-2xl w-full">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-10 text-center">
          <h1 className="text-3xl font-bold mb-2">🏪 Merchant Registration</h1>
          <p className="opacity-90">Register to accept stablecoin payments</p>
        </div>

        <div className="p-10">
          <div className="bg-gray-50 border-l-4 border-purple-500 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">📋 What You'll Get</h3>
            <ul className="space-y-2">
              <li className="text-gray-700 text-sm">✓ Accept USDC and EURC payments</li>
              <li className="text-gray-700 text-sm">✓ 0.2% platform fee on all transactions</li>
              <li className="text-gray-700 text-sm">✓ Direct settlement to your wallet</li>
              <li className="text-gray-700 text-sm">✓ Full payment history tracking</li>
            </ul>
          </div>

          <div className="flex justify-center mb-8">
            <ConnectButton />
          </div>

          {isConnected && (
            <>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
                <p className="text-green-800 font-semibold mb-2">✅ Connected Wallet</p>
                <div className="bg-white bg-opacity-50 px-3 py-2 rounded font-mono text-xs break-all">
                  {address}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Merchant Address (Your Connected Wallet)
                  </label>
                  <input
                    type="text"
                    value={address}
                    disabled
                    className="w-full p-4 border-2 border-gray-200 rounded-xl font-mono text-sm bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This address will be used to identify your merchant account
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Receiving Address
                  </label>
                  <input
                    type="text"
                    value={paymentAddress}
                    onChange={(e) => setPaymentAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-purple-500 focus:outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Where you want to receive payments (can be different from merchant address)
                  </p>
                </div>

                {status && (
                  <div className={`p-4 rounded-xl border-l-4 ${
                    status.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-700' :
                    status.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    'bg-red-50 border-red-500 text-red-700'
                  }`}>
                    {status.message}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={isRegistering || !paymentAddress}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
                >
                  {isRegistering ? 'Registering...' : 'Register Merchant'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-center text-white mt-5 opacity-90">
        Payst Checkout Platform
      </div>
    </div>
  )
}