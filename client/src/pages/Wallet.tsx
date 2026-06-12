import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownLeft, Zap, TrendingUp, Calendar } from "lucide-react";

export default function Wallet() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: wallet, isLoading: walletLoading } = trpc.wallet.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: transactions, isLoading: transLoading } = trpc.wallet.getTransactionHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Zap className="w-8 h-8 text-accent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">You need to sign in to view your wallet.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const cashValue = wallet ? (wallet.currentBalance * 0.01).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your points and track your earnings</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Balance Card */}
          <Card className="lg:col-span-2 p-8 bg-gradient-to-br from-accent to-blue-600 text-white">
            <p className="text-sm opacity-90 mb-2">Current Balance</p>
            <h2 className="text-5xl font-bold mb-8">
              ${cashValue}
              <span className="text-2xl ml-2 opacity-75">({wallet?.currentBalance} pts)</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/rewards">
                <Button variant="secondary" className="w-full">
                  Redeem Rewards
                </Button>
              </Link>
              <Link href="/withdraw">
                <Button variant="secondary" className="w-full">
                  Withdraw
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{wallet?.totalEarned} pts</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${(wallet ? wallet.totalEarned * 0.01 : 0).toFixed(2)}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Redeemed</p>
                <ArrowDownLeft className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{wallet?.totalRedeemed} pts</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${(wallet ? wallet.totalRedeemed * 0.01 : 0).toFixed(2)}
              </p>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Transaction History</h2>

          {transLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete surveys to start earning points
              </p>
              <Link href="/surveys">
                <Button className="mt-4">Browse Surveys</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: {
    id: number;
    type: string;
    amount: number;
    description: string | null;
    expiryDate: Date | null;
    createdAt: Date;
  };
}) {
  const typeConfig: Record<
    string,
    { icon: typeof ArrowUpRight; color: string; label: string }
  > = {
    survey_completion: {
      icon: ArrowUpRight,
      color: "text-green-500",
      label: "Survey Completed",
    },
    referral_bonus: {
      icon: ArrowUpRight,
      color: "text-green-500",
      label: "Referral Bonus",
    },
    redemption: {
      icon: ArrowDownLeft,
      color: "text-blue-500",
      label: "Reward Redeemed",
    },
    withdrawal: {
      icon: ArrowDownLeft,
      color: "text-blue-500",
      label: "Withdrawal",
    },
    adjustment: {
      icon: ArrowUpRight,
      color: "text-gray-500",
      label: "Adjustment",
    },
  };

  const config = typeConfig[transaction.type] || typeConfig.adjustment;
  const Icon = config.icon;
  const isPositive = transaction.amount > 0;

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-2 rounded-full bg-muted ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{config.label}</p>
          <p className="text-sm text-muted-foreground">
            {transaction.description || new Date(transaction.createdAt).toLocaleDateString()}
          </p>
          {transaction.expiryDate && (
            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Expires {new Date(transaction.expiryDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <p className={`text-lg font-bold ${isPositive ? "text-green-500" : "text-blue-500"}`}>
        {isPositive ? "+" : "-"}
        {Math.abs(transaction.amount)} pts
      </p>
    </div>
  );
}
