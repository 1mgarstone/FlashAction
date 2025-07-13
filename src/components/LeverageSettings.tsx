
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TRADING_CONFIG } from '../config/trading';

interface LeverageSettingsProps {
  walletBalance: number;
  currentNetwork?: string;
}

export const LeverageSettings: React.FC<LeverageSettingsProps> = ({ 
  walletBalance, 
  currentNetwork = 'Ethereum' 
}) => {
  const leverageMultiplier = TRADING_CONFIG.LEVERAGE_MULTIPLIER;
  const allocationPercentage = TRADING_CONFIG.FLASH_LOAN.DEFAULT_ALLOCATION_PERCENTAGE;
  const allocatedBalance = walletBalance * (allocationPercentage / 100);
  const flashLoanAmount = allocatedBalance * leverageMultiplier;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Leverage Configuration</span>
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
            Standardized 1400%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-black/20 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Leverage Multiplier</div>
            <div className="text-2xl font-bold text-green-400">{leverageMultiplier}%</div>
            <div className="text-xs text-gray-500">Standardized across all networks</div>
          </div>
          
          <div className="p-3 bg-black/20 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Balance Allocation</div>
            <div className="text-2xl font-bold text-blue-400">{allocationPercentage}%</div>
            <div className="text-xs text-gray-500">Of total wallet balance</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Wallet Balance</span>
            <span className="font-medium">{formatCurrency(walletBalance)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Allocated Amount ({allocationPercentage}%)</span>
            <span className="font-medium text-blue-400">{formatCurrency(allocatedBalance)}</span>
          </div>
          
          <div className="flex justify-between items-center border-t border-gray-700 pt-3">
            <span className="text-sm text-gray-400">Flash Loan Capacity</span>
            <span className="font-bold text-green-400 text-lg">{formatCurrency(flashLoanAmount)}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
          <div className="text-xs text-blue-400 font-medium mb-1">Leverage Calculation</div>
          <div className="text-xs text-gray-300">
            {formatCurrency(walletBalance)} × {allocationPercentage}% × {leverageMultiplier}% = {formatCurrency(flashLoanAmount)}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          ✓ Free flash loans from Balancer, dYdX<br/>
          ✓ 0.05% fee maximum from Aave (if needed)<br/>
          ✓ Consistent {leverageMultiplier}% leverage across all networks
        </div>
      </CardContent>
    </Card>
  );
};
