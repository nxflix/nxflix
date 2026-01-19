/**
 * Pay With Crypto Dialog
 * Handles crypto payment flow via SideShift for subscriptions
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useSideshift,
  useSupportedAssets,
  usePairInfo,
  useShiftMonitor,
  sortAssets,
  POPULAR_COINS,
  type SupportedAsset,
  type Plan,
} from '@/lib/sideshift';
import {
  Loader2,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayWithCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan;
  chainId: number;
  chainName: string;
  userAddress: string;
  onSuccess?: () => void;
}

type Step = 'select' | 'amount' | 'deposit' | 'processing' | 'complete';

export function PayWithCryptoDialog({
  open,
  onOpenChange,
  plan,
  chainId,
  chainName,
  userAddress,
  onSuccess,
}: PayWithCryptoDialogProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedCoin, setSelectedCoin] = useState<SupportedAsset | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { assets, loading: assetsLoading } = useSupportedAssets();
  const { createSubscriptionShift, loading: creating } = useSideshift();
  const { pairInfo, loading: pairLoading } = usePairInfo(
    selectedCoin?.coin ?? null,
    'ETH',
    selectedNetwork || undefined,
    chainId === 84532 ? 'base' : 'sepolia'
  );
  const { status, shiftData } = useShiftMonitor(shiftId);

  const sortedAssets = useMemo(() => sortAssets(assets), [assets]);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep('select');
      setSelectedCoin(null);
      setSelectedNetwork('');
      setAmount('');
      setShiftId(null);
      setDepositAddress('');
    }
    onOpenChange(open);
  };

  // Handle coin selection
  const handleCoinSelect = (coin: string) => {
    const asset = assets.find((a) => a.coin === coin);
    if (asset) {
      setSelectedCoin(asset);
      setSelectedNetwork(asset.networks[0] || '');
    }
  };

  // Proceed to amount step
  const handleProceedToAmount = () => {
    if (selectedCoin && selectedNetwork) {
      setStep('amount');
    }
  };

  // Create shift and proceed to deposit step
  const handleCreateShift = async () => {
    if (!selectedCoin || !amount) return;

    const result = await createSubscriptionShift({
      userAddress,
      planId: plan.id,
      chainId,
      sourceCoin: selectedCoin.coin,
      sourceNetwork: selectedNetwork,
      sourceAmount: amount,
    });

    if (result) {
      setShiftId(result.shift.id);
      setDepositAddress(result.sideshift.depositAddress);
      setStep('deposit');
    }
  };

  // Copy deposit address
  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle status changes
  if (status === 'processing' && step === 'deposit') {
    setStep('processing');
  }
  if (status === 'settled' && step !== 'complete') {
    setStep('complete');
    onSuccess?.();
  }

  // Calculate estimated receive amount
  const estimatedReceive = useMemo(() => {
    if (!pairInfo || !amount) return null;
    const amountNum = parseFloat(amount);
    const rate = parseFloat(pairInfo.rate);
    if (isNaN(amountNum) || isNaN(rate)) return null;
    return (amountNum * rate).toFixed(6);
  }, [amount, pairInfo]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Pay with Crypto
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Select the cryptocurrency you want to pay with'}
            {step === 'amount' && 'Enter the amount you want to send'}
            {step === 'deposit' && 'Send your crypto to the deposit address'}
            {step === 'processing' && 'Processing your payment'}
            {step === 'complete' && 'Payment complete!'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Select Cryptocurrency */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cryptocurrency</Label>
              {assetsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Select
                  value={selectedCoin?.coin}
                  onValueChange={handleCoinSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {POPULAR_COINS.some((c) =>
                      sortedAssets.some((a) => a.coin === c)
                    ) && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Popular
                      </div>
                    )}
                    {sortedAssets.map((asset) => (
                      <SelectItem key={asset.coin} value={asset.coin}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.coin}</span>
                          <span className="text-muted-foreground text-sm">
                            {asset.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedCoin && selectedCoin.networks.length > 1 && (
              <div className="space-y-2">
                <Label>Network</Label>
                <Select
                  value={selectedNetwork}
                  onValueChange={setSelectedNetwork}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCoin.networks.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Card className="p-4 bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{plan.durationDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span>{plan.priceFormatted} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span>{chainName}</span>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleProceedToAmount}
              disabled={!selectedCoin || !selectedNetwork}
              className="w-full"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Enter Amount */}
        {step === 'amount' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount ({selectedCoin?.coin})</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={pairInfo?.min}
                max={pairInfo?.max}
                step="any"
              />
              {pairLoading && (
                <p className="text-sm text-muted-foreground">
                  Loading limits...
                </p>
              )}
              {pairInfo && (
                <p className="text-sm text-muted-foreground">
                  Min: {pairInfo.min} {selectedCoin?.coin} | Max: {pairInfo.max}{' '}
                  {selectedCoin?.coin}
                </p>
              )}
            </div>

            {estimatedReceive && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    You'll receive approximately:
                  </span>
                  <span className="font-semibold">{estimatedReceive} ETH</span>
                </div>
                {pairInfo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rate: 1 {selectedCoin?.coin} = {pairInfo.rate} ETH
                  </p>
                )}
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateShift}
                disabled={!amount || creating}
                className="flex-1"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Deposit */}
        {step === 'deposit' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <p className="font-medium">Waiting for deposit</p>
              <p className="text-sm text-muted-foreground">
                Send exactly {amount} {selectedCoin?.coin} to the address below
              </p>
            </div>

            <div className="space-y-2">
              <Label>Deposit Address ({selectedNetwork})</Label>
              <div className="flex gap-2">
                <Input
                  value={depositAddress}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAddress}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Card className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Send:</span>
                  <span className="font-medium">
                    {amount} {selectedCoin?.coin}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span>{selectedNetwork}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    Waiting
                  </Badge>
                </div>
              </div>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              This page will automatically update when your payment is detected
            </p>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-semibold text-lg">Processing Payment</p>
              <p className="text-sm text-muted-foreground">
                Converting {shiftData?.sourceAsset} to ETH
              </p>
            </div>
            {shiftData?.depositTxHash && (
              <p className="text-xs text-muted-foreground">
                Deposit TX: {shiftData.depositTxHash.slice(0, 10)}...
              </p>
            )}
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <p className="font-semibold text-lg">Payment Complete!</p>
              <p className="text-sm text-muted-foreground">
                Your subscription has been activated
              </p>
            </div>

            {shiftData?.subscriptionTxHash && (
              <Button variant="outline" asChild>
                <a
                  href={`${chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://sepolia.etherscan.io'}/tx/${shiftData.subscriptionTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  View Transaction
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}

            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
