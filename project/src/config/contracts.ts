// Addresses are fetched from .env file
export const CONTRACTS = {
  LENDING_POOL: import.meta.env.VITE_LENDING_POOL_ADDRESS,
  COLLATERAL_MANAGER: import.meta.env.VITE_COLLATERAL_MANAGER_ADDRESS,
  LIQUIDATION_ENGINE: import.meta.env.VITE_LIQUIDATION_ENGINE_ADDRESS,
  INTEREST_RATE_MODEL: import.meta.env.VITE_INTEREST_RATE_MODEL_ADDRESS,
  RISK_ENGINE: import.meta.env.VITE_RISK_ENGINE_ADDRESS,
  AI_COMPUTE_VAULT: import.meta.env.VITE_AI_COMPUTE_VAULT_ADDRESS,
  PORTFOLIO_REBALANCER: import.meta.env.VITE_PORTFOLIO_REBALANCER_ADDRESS,
  GASLESS_AA: import.meta.env.VITE_GASLESS_AA_ADDRESS,
  RECEIPT_GENERATOR: import.meta.env.VITE_RECEIPT_GENERATOR_ADDRESS,
} as const;

// Asset addresses are fetched from .env file
export const ASSETS = {
  ETH: import.meta.env.VITE_ETH_ADDRESS,
  USDC: import.meta.env.VITE_USDC_ADDRESS,
  USDT: import.meta.env.VITE_USDT_ADDRESS,
  WBTC: import.meta.env.VITE_WBTC_ADDRESS,
} as const;

// Chain configuration from .env file
export const CHAIN_CONFIG = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID),
  name: import.meta.env.VITE_CHAIN_NAME,
  rpcUrl: import.meta.env.VITE_RPC_URL,
  blockExplorer: import.meta.env.VITE_BLOCK_EXPLORER,
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const isContractDeployed = (address: string): boolean => {
  return address !== '0x0000000000000000000000000000000000000000';
};

export const getContractStatus = () => {
  return {
    lendingPool: isContractDeployed(CONTRACTS.LENDING_POOL),
    collateralManager: isContractDeployed(CONTRACTS.COLLATERAL_MANAGER),
    liquidationEngine: isContractDeployed(CONTRACTS.LIQUIDATION_ENGINE),
    interestRateModel: isContractDeployed(CONTRACTS.INTEREST_RATE_MODEL),
    riskEngine: isContractDeployed(CONTRACTS.RISK_ENGINE),
    aiComputeVault: isContractDeployed(CONTRACTS.AI_COMPUTE_VAULT),
    portfolioRebalancer: isContractDeployed(CONTRACTS.PORTFOLIO_REBALANCER),
    gaslessAA: isContractDeployed(CONTRACTS.GASLESS_AA),
    receiptGenerator: isContractDeployed(CONTRACTS.RECEIPT_GENERATOR),
  };
};
