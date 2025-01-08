# Superfluid Rewards Distribution UI

A Next.js application that allows users to easily set up streaming rewards distribution using Superfluid's GDA (General Distribution Agreement) protocol and Macro system.

## Overview

This application provides a user-friendly interface for distributing streaming rewards to multiple recipients simultaneously. It leverages Superfluid's Macro system to batch multiple operations into a single transaction, making it gas-efficient and convenient.

## Features

- **Network Management**: Automatic detection and switching to Optimism Sepolia network
- **Pool Validation**: Real-time validation of Superfluid pool addresses
- **Balance Checking**: Automatic checking of user's Super Token balance
- **Batch Distribution**: Set up multiple reward streams in a single transaction
- **User-Friendly Interface**: Simple input format for multiple recipients and their units
- **Real-Time Feedback**: Immediate feedback on input validation and transaction status

## Prerequisites

- MetaMask or another Web3 wallet
- ETH on Optimism Sepolia network
- Super Tokens from a valid Superfluid pool

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and ensure you're on Optimism Sepolia network
2. **Enter Pool Address**: Input the address of the Superfluid pool you want to distribute from
3. **Add Recipients**: Enter recipient addresses and their units in the format:
```
0x123...,100
0x456...,200
```
4. **Set Flow Rate**: Enter the total reward flow rate in tokens per day
5. **Execute**: Click "Start Reward Distribution" to execute the transaction

## Contract Addresses

- MacroForwarder: `0xFD0268E33111565dE546af2675351A4b1587F89F`
- RewardsMacro: `0xA315e7EB0a278fac7B3a74DB895f5bf801EAb632`
- Chain: Optimism Sepolia (Chain ID: 11155420)

## Technical Details

The application uses:
- Next.js 14
- ethers.js v6
- Superfluid Protocol
- Tailwind CSS for styling
- Shadcn/ui for components

## Network Support

Currently supports:
- Optimism Sepolia (Chain ID: 11155420)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Superfluid Protocol](https://www.superfluid.finance/)
- [Next.js](https://nextjs.org/)
- [Shadcn/ui](https://ui.shadcn.com/)
