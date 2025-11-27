import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.arc.network'] },
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
}

export const config = getDefaultConfig({
  appName: 'Payst Checkout',
  projectId: 'f756d2797f410666990ef7da28446168', 
  chains: [ARC_TESTNET],
})