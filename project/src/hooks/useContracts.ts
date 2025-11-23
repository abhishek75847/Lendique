import { ethers } from 'ethers';
import { useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACTS } from '../config/contracts';
import LendingPoolABI from '../abis/LendingPool.json';
import CollateralManagerABI from '../abis/CollateralManager.json';
import InterestRateModelABI from '../abis/InterestRateModel.json';
import ReceiptGeneratorABI from '../abis/ReceiptGenerator.json';
import RiskEngineABI from '../abis/RiskEngine.json';
import LiquidationEngineABI from '../abis/LiquidationEngine.json';
import AIComputeVaultABI from '../abis/AIComputeVault.json';
import PortfolioRebalancerABI from '../abis/PortfolioRebalancer.json';
import GaslessAAAABI from '../abis/GaslessAA.json';
import ERC20ABI from '../abis/ERC20.json';

export function useContracts() {
  const { provider, signer } = useWallet();

  const contracts = useMemo(() => {
    if (!provider) return null;

    const readProvider = provider;
    const writeProvider = signer || provider;

    return {
      lendingPool: {
        read: new ethers.Contract(
          CONTRACTS.LENDING_POOL,
          LendingPoolABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.LENDING_POOL,
          LendingPoolABI.abi,
          writeProvider
        ),
      },
      collateralManager: {
        read: new ethers.Contract(
          CONTRACTS.COLLATERAL_MANAGER,
          CollateralManagerABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.COLLATERAL_MANAGER,
          CollateralManagerABI.abi,
          writeProvider
        ),
      },
      interestRateModel: {
        read: new ethers.Contract(
          CONTRACTS.INTEREST_RATE_MODEL,
          InterestRateModelABI.abi,
          readProvider
        ),
      },
      receiptGenerator: {
        read: new ethers.Contract(
          CONTRACTS.RECEIPT_GENERATOR,
          ReceiptGeneratorABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.RECEIPT_GENERATOR,
          ReceiptGeneratorABI.abi,
          writeProvider
        ),
      },
      riskEngine: {
        read: new ethers.Contract(
          CONTRACTS.RISK_ENGINE,
          RiskEngineABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.RISK_ENGINE,
          RiskEngineABI.abi,
          writeProvider
        ),
      },
      liquidationEngine: {
        read: new ethers.Contract(
          CONTRACTS.LIQUIDATION_ENGINE,
          LiquidationEngineABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.LIQUIDATION_ENGINE,
          LiquidationEngineABI.abi,
          writeProvider
        ),
      },
      aiComputeVault: {
        read: new ethers.Contract(
          CONTRACTS.AI_COMPUTE_VAULT,
          AIComputeVaultABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.AI_COMPUTE_VAULT,
          AIComputeVaultABI.abi,
          writeProvider
        ),
      },
      portfolioRebalancer: {
        read: new ethers.Contract(
          CONTRACTS.PORTFOLIO_REBALANCER,
          PortfolioRebalancerABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.PORTFOLIO_REBALANCER,
          PortfolioRebalancerABI.abi,
          writeProvider
        ),
      },
      gaslessAA: {
        read: new ethers.Contract(
          CONTRACTS.GASLESS_AA,
          GaslessAAAABI.abi,
          readProvider
        ),
        write: new ethers.Contract(
          CONTRACTS.GASLESS_AA,
          GaslessAAAABI.abi,
          writeProvider
        ),
      },
      erc20: (tokenAddress: string) => ({
        read: new ethers.Contract(tokenAddress, ERC20ABI.abi, readProvider),
        write: new ethers.Contract(tokenAddress, ERC20ABI.abi, writeProvider),
      }),
    };
  }, [provider, signer]);

  return contracts;
}
