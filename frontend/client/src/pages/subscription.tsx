import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  useChainSelector,
  useSubscriptionPlans,
  useUserSubscription,
  useSubscribe,
  useRenewSubscription,
  useToggleAutoRenew,
  SUPPORTED_CHAINS,
  type Plan,
  type SupportedChainId,
} from '@/lib/contracts';
import { useEthPrice, ethToUsd, formatUsd } from '@/lib/hooks';
import { PayWithCryptoDialog } from '@/components/sideshift';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Crown,
  Check,
  Loader2,
  Clock,
  Zap,
  Shield,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Network,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const { isAuthenticated, userWallet, login } = useAuth();
  const { toast } = useToast();
  const { chainId, setChainId, chainInfo } = useChainSelector();
  const { ethPrice } = useEthPrice();

  const { plans, loading: plansLoading } = useSubscriptionPlans(chainId);
  const { subscription, loading: subLoading, refetch } = useUserSubscription(userWallet || undefined, chainId);
  const { subscribe, loading: subscribing } = useSubscribe(chainId);
  const { renew, loading: renewing } = useRenewSubscription(chainId);
  const { toggleAutoRenew, loading: togglingAutoRenew } = useToggleAutoRenew(chainId);

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [cryptoPaymentPlan, setCryptoPaymentPlan] = useState<Plan | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      setSelectedPlan(plan.id);
      await subscribe(plan.id, plan.price, false);
      toast({
        title: 'Subscription Activated!',
        description: `You now have access to all premium features for ${plan.durationDays} days.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Transaction Failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSelectedPlan(null);
    }
  };

  const handleRenew = async () => {
    if (!subscription) return;

    const plan = plans.find((p) => p.id === subscription.planId);
    if (!plan) return;

    try {
      await renew(plan.price);
      toast({
        title: 'Subscription Renewed!',
        description: `Your subscription has been extended.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Renewal Failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAutoRenew = async (enabled: boolean) => {
    try {
      await toggleAutoRenew(enabled);
      toast({
        title: enabled ? 'Auto-Renewal Enabled' : 'Auto-Renewal Disabled',
        description: enabled
          ? 'Your subscription will automatically renew.'
          : 'Your subscription will expire at the end of the period.',
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Failed to Update',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const features = [
    { icon: Sparkles, text: 'AI-Generated Study Content' },
    { icon: Zap, text: 'Unlimited Quiz Generation' },
    { icon: Shield, text: 'Progress Tracking & Analytics' },
    { icon: Clock, text: 'Spaced Repetition System' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Crown className="w-5 h-5" />
            <span className="font-medium">Premium Access</span>
          </div>
          <h1 className="text-4xl font-serif font-bold">Unlock Your Full Potential</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get unlimited access to AI-powered JLPT N1 study tools, personalized learning paths,
            and advanced progress tracking.
          </p>
        </div>

        {/* Chain Selector */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Network</p>
                <p className="text-xs text-muted-foreground">Select blockchain network</p>
              </div>
            </div>
            <Select
              value={chainId.toString()}
              onValueChange={(value) => setChainId(Number(value) as SupportedChainId)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_CHAINS).map(([id, config]) => (
                  <SelectItem key={id} value={id}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Current Subscription Status */}
        {subscription?.isActive && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Active Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    {plans.find((p) => p.id === subscription.planId)?.name} Plan
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {subscription.timeRemainingFormatted} remaining
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Auto-renew:</span>
                  <Switch
                    checked={subscription.autoRenew}
                    onCheckedChange={handleToggleAutoRenew}
                    disabled={togglingAutoRenew}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-primary/20 flex gap-4">
              <Button
                variant="outline"
                onClick={handleRenew}
                disabled={renewing}
                className="gap-2"
              >
                {renewing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Renew Now
              </Button>
              <Button variant="ghost" asChild>
                <a
                  href={`${chainInfo.explorer}/address/${userWallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </Card>
        )}

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="p-4 text-center">
              <feature.icon className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">{feature.text}</p>
            </Card>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plansLoading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            plans
              .filter((plan) => plan.active)
              .map((plan) => {
                const isCurrentPlan = subscription?.planId === plan.id && subscription.isActive;
                const isPopular = plan.id === 2; // Yearly plan

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      'p-6 relative',
                      isPopular && 'border-primary shadow-lg shadow-primary/10',
                      isCurrentPlan && 'bg-primary/5'
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                        Best Value
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.priceFormatted}</span>
                        <span className="text-muted-foreground ml-1">ETH</span>
                      </div>
                      {ethPrice && (
                        <p className="text-sm text-primary font-medium mt-1">
                          ≈ {formatUsd(ethToUsd(plan.priceFormatted, ethPrice))}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.durationDays} days access
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature.text}
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(plan)}
                        disabled={subscribing || isCurrentPlan}
                      >
                        {subscribing && selectedPlan === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : (
                          'Pay with ETH'
                        )}
                      </Button>
                      {!isCurrentPlan && (
                        <Button
                          variant="ghost"
                          className="w-full gap-2"
                          onClick={() => {
                            if (!isAuthenticated) {
                              login();
                              return;
                            }
                            setCryptoPaymentPlan(plan);
                          }}
                        >
                          <Coins className="w-4 h-4" />
                          Pay with Crypto
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
          )}
        </div>

        {/* Not Connected Message */}
        {!isAuthenticated && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to subscribe and access premium features.
            </p>
            <Button onClick={login} size="lg">
              Connect Wallet
            </Button>
          </Card>
        )}

        {/* Testnet Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Currently on {chainInfo.name} Testnet. Payments use test ETH.
            <br />
            Get test ETH from{' '}
            <a
              href={chainId === 84532 ? 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet' : 'https://sepoliafaucet.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {chainId === 84532 ? 'Base Faucet' : 'Sepolia Faucet'}
            </a>
          </p>
        </div>
      </div>

      {/* Pay with Crypto Dialog */}
      {cryptoPaymentPlan && userWallet && (
        <PayWithCryptoDialog
          open={!!cryptoPaymentPlan}
          onOpenChange={(open) => !open && setCryptoPaymentPlan(null)}
          plan={cryptoPaymentPlan}
          chainId={chainId}
          chainName={chainInfo.name}
          userAddress={userWallet}
          onSuccess={() => {
            refetch();
            setCryptoPaymentPlan(null);
          }}
        />
      )}
    </div>
  );
}
