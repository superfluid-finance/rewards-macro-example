'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, ethers } from 'ethers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { POOL_ABI, SUPER_TOKEN_ABI, MACRO_FORWARDER_ABI, REWARDS_MACRO_ABI } from './abis'

// Contract addresses
const MACRO_FORWARDER = "0xFD0268E33111565dE546af2675351A4b1587F89F"
const REWARDS_MACRO = "0xA315e7EB0a278fac7B3a74DB895f5bf801EAb632"

// Chain IDs
const OP_SEPOLIA_CHAIN_ID = "0xaa37dc"

// Helper function to switch networks
const switchToOpSepolia = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: OP_SEPOLIA_CHAIN_ID }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: OP_SEPOLIA_CHAIN_ID,
            chainName: 'Optimism Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.optimism.io'],
            blockExplorerUrls: ['https://sepolia-optimism.etherscan.io/'],
          }],
        });
        return true;
      } catch (addError) {
        console.error('Error adding OP Sepolia network:', addError);
        return false;
      }
    }
    console.error('Error switching to OP Sepolia:', switchError);
    return false;
  }
}

export default function RewardsMacroPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [poolAddress, setPoolAddress] = useState('')
  const [receiversData, setReceiversData] = useState('')
  const [flowRatePerDay, setFlowRatePerDay] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [chainId, setChainId] = useState<string | null>(null)
  const [poolTokenAddress, setPoolTokenAddress] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState<string | null>(null)
  const [isValidPool, setIsValidPool] = useState<boolean | null>(null)

  // Add network check on mount and when network changes
  useEffect(() => {
    const checkNetwork = async () => {
      const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
      setChainId(chainId);
    };

    checkNetwork();
    window.ethereum?.on('chainChanged', checkNetwork);
    return () => {
      window.ethereum?.removeListener('chainChanged', checkNetwork);
    };
  }, []);

  // Updated pool validation and balance check
  useEffect(() => {
    const checkPoolAndBalance = async () => {
      if (!poolAddress || !isConnected) {
        setPoolTokenAddress(null);
        setUserBalance(null);
        setIsValidPool(null);
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const poolContract = new ethers.BaseContract(poolAddress, POOL_ABI, provider);

        // Check if it's a valid pool by calling superToken()
        try {
          const tokenAddress = await poolContract.superToken();
          console.log("tokenAddress", tokenAddress);
          // tokenAddress is now the contract address of the ISuperfluidToken
          setPoolTokenAddress(tokenAddress);
          setIsValidPool(true);

          // Get user's balance using the token contract address
          const tokenContract = new ethers.Contract(tokenAddress, SUPER_TOKEN_ABI, provider);
          const balance = await tokenContract.balanceOf(await signer.getAddress());
          setUserBalance(ethers.formatEther(balance));
        } catch (e) {
          setIsValidPool(false);
          setPoolTokenAddress(null);
          setUserBalance(null);
        }
      } catch (e) {
        console.error('Error checking pool:', e);
      }
    };

    checkPoolAndBalance();
  }, [poolAddress, isConnected]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask");
      
      // Check and switch to OP Sepolia first
      if (chainId !== OP_SEPOLIA_CHAIN_ID) {
        const switched = await switchToOpSepolia();
        if (!switched) throw new Error("Please switch to Optimism Sepolia network");
      }

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      setIsConnected(true);
      setError('');
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  }

  const executeRewardsMacro = async () => {
    try {
      if (!isConnected) throw new Error("Please connect your wallet first")
      
      // Parse receivers data
      const lines = receiversData.split('\n').filter(line => line.trim())
      const receivers: string[] = []
      const units: bigint[] = []
      
      for (const line of lines) {
        const [addr, unit] = line.split(',').map(s => s.trim())
        if (!addr || !unit) throw new Error("Invalid format. Use: address,units")
        receivers.push(addr)
        units.push(BigInt(unit))
      }

      // Convert tokens/day to wei/second for the flow rate
      const tokensPerDay = parseFloat(flowRatePerDay)
      const weiBigInt = ethers.parseEther(flowRatePerDay)
      const secondsInDay = 86400
      const flowRateWeiPerSecond = weiBigInt / BigInt(secondsInDay)

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Get params from RewardsMacro contract
      const rewardsMacro = new ethers.Contract(
        REWARDS_MACRO,
        REWARDS_MACRO_ABI,
        signer
      )
      
      const params = await rewardsMacro.getParams(
        poolAddress,
        receivers,
        units,
        flowRateWeiPerSecond
      )

      // Execute macro through MacroForwarder
      const macroForwarder = new ethers.Contract(
        MACRO_FORWARDER,
        MACRO_FORWARDER_ABI,
        signer
      )

      setStatus('Executing macro...')
      const tx = await macroForwarder.runMacro(REWARDS_MACRO, params)
      await tx.wait()
      setStatus('Successfully set up reward distribution!')
      setError('')
    } catch (err) {
      setError('Transaction failed: ' + err.message)
      setStatus('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto bg-gray-800 border border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-white">Reward Stream Distribution</CardTitle>
            <CardDescription className="text-gray-400">
              Set up streaming rewards to multiple recipients at once
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {chainId !== OP_SEPOLIA_CHAIN_ID && (
              <Alert className="bg-yellow-900/50 border-yellow-600">
                <AlertDescription>
                  Please connect to Optimism Sepolia network
                </AlertDescription>
              </Alert>
            )}

            {!isConnected ? (
              <Button 
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Connect Wallet
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Pool Address</label>
                  <Input
                    placeholder="0x..."
                    value={poolAddress}
                    onChange={(e) => setPoolAddress(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  {poolAddress && (
                    <div className="mt-2">
                      {isValidPool === false && (
                        <p className="text-red-400 text-sm">Invalid pool address</p>
                      )}
                      {isValidPool && poolTokenAddress && (
                        <div className="text-sm">
                          <p className="text-green-400">Valid pool ✓</p>
                          <p className="text-gray-400">
                            Token: {poolTokenAddress}
                          </p>
                          <p className="text-gray-400">
                            Your balance: {userBalance ? `${userBalance} tokens` : 'Loading...'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Recipients and Units</label>
                  <p className="text-sm text-gray-400">
                    Enter one recipient per line in the format: address,units
                  </p>
                  <textarea
                    className="w-full min-h-[200px] p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="0x123...,100&#10;0x456...,200"
                    value={receiversData}
                    onChange={(e) => setReceiversData(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Reward Flow Rate (tokens/day)</label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="1.5"
                    value={flowRatePerDay}
                    onChange={(e) => setFlowRatePerDay(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <Button 
                  onClick={executeRewardsMacro}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                  disabled={!isValidPool || !userBalance || Number(userBalance) === 0}
                >
                  Start Reward Distribution
                </Button>
              </>
            )}

            {status && (
              <Alert className="bg-green-900/50 border-green-600">
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="bg-red-900/50 border-red-600">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}