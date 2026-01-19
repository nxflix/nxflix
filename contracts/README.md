# NXFlix Subscription Contracts

Smart contracts for time-based subscriptions on the NXFlix JLPT study platform.

## Supported Chains

- **Ethereum** (chainId: 1)
- **Base** (chainId: 8453)

## Contracts

### Subscription.sol

Time-based subscription contract with the following features:

- **Multiple Plans**: Monthly, Quarterly, Yearly (customizable)
- **Auto-Renewal**: Optional auto-renewal flag for subscribers
- **Admin Controls**: Create/update plans, grant subscriptions, withdraw funds
- **Gas Optimized**: Efficient storage layout and operations

#### Default Plans

| Plan      | Price    | Duration |
| --------- | -------- | -------- |
| Monthly   | 0.01 ETH | 30 days  |
| Quarterly | 0.025 ETH| 90 days  |
| Yearly    | 0.08 ETH | 365 days |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Setup

```bash
# Install dependencies
forge install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Build contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_Subscribe_Monthly -vvv
```

### Testing

```bash
# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run coverage
forge coverage
```

## Deployment

### Local (Anvil)

```bash
# Start local node
anvil

# Deploy
forge script script/DeploySubscription.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet (Sepolia / Base Sepolia)

```bash
# Load environment
source .env

# Deploy to Sepolia
forge script script/DeploySubscription.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy to Base Sepolia
forge script script/DeploySubscription.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Mainnet (Ethereum / Base)

```bash
# Deploy to Ethereum
forge script script/DeploySubscription.s.sol \
  --rpc-url $ETH_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy to Base
forge script script/DeploySubscription.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## Contract Interaction

### Using Cast

```bash
# Check if address has active subscription
cast call <CONTRACT_ADDRESS> "isActive(address)" <USER_ADDRESS> --rpc-url $BASE_RPC_URL

# Get subscription details
cast call <CONTRACT_ADDRESS> "getSubscription(address)" <USER_ADDRESS> --rpc-url $BASE_RPC_URL

# Subscribe (send 0.01 ETH for monthly plan)
cast send <CONTRACT_ADDRESS> "subscribe(uint256,bool)" 0 false \
  --value 0.01ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $BASE_RPC_URL
```

## Security

- Contracts have not been audited
- Use at your own risk
- Report vulnerabilities responsibly

## License

MIT
