import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Zap, TrendingUp, ArrowUpRight, ArrowDownLeft,
  Users, ClipboardList, Wallet, Gift, ChevronRight,
  Star, Target, Award
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: wallet } = trpc.wallet.getBalance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: transactions } = trpc.wallet.getTransactionHistory.useQuery({ limit: 5 }, { enabled: isAuthenticated });
  const { data: surveys } = trpc.survey.list.useQuery({ limit: 3, offset: 0 }, { enabled: isAuthenticated });
  const { data: referral } = trpc.referral.getReferralStats.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin"><Zap className="w-8 h-8 text-accent" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <Link href="/"><Button>Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  const cashValue = wallet ? (wallet.currentBalance * 0.01).toFixed(2) : "0.00";
  const totalEarnedCash = wallet ? (wallet.totalEarned * 0.01).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your account</p>
        </div>
      </div>

      <div className="container py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-accent to-blue-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <Wallet className="w-5 h-5 opacity-80" />
              <span className="text-xs opacity-75">Balance</span>
            </div>
            <p className="text-3xl font-bold">${cashValue}</p>
            <p className="text-xs opacity-75 mt-1">{wallet?.currentBalance || 0} points</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Earned</span>
            </div>
            <p className="text-3xl font-bold">${totalEarnedCash}</p>
            <p className="text-xs text-muted-foreground mt-1">{wallet?.totalEarned || 0} points</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Referrals</span>
            </div>
            <p className="text-3xl font-bold">{referral?.totalSignups || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ${Number(referral?.totalEarnings || 0).toFixed(2)} earned
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-muted-foreground">Redeemed</span>
            </div>
            <p className="text-3xl font-bold">${wallet ? (wallet.totalRedeemed * 0.01).toFixed(2) : "0.00"}</p>
            <p className="text-xs text-muted-foreground mt-1">{wallet?.totalRedeemed || 0} points</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ClipboardList, label: "Take a Survey", href: "/surveys", color: "text-accent", bg: "bg-accent/10" },
              { icon: Gift, label: "Redeem Rewards", href: "/rewards", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Users, label: "Refer Friends", href: "/referrals", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Wallet, label: "Withdraw", href: "/withdraw", color: "text-green-500", bg: "bg-green-500/10" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="p-6 text-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">
                  <div className={`w-12 h-12 ${action.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <p className="text-sm font-medium">{action.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Surveys */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Available Surveys</h2>
              <Link href="/surveys">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {surveys && surveys.length > 0 ? (
              <div className="space-y-3">
                {surveys.map((survey) => (
                  <Link key={survey.id} href={`/survey/${survey.id}`}>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{survey.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {survey.estimatedDurationMinutes || 5} min • {survey.category || "General"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm font-bold text-accent">+{survey.pointsReward} pts</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No surveys available right now</p>
                <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <Link href="/wallet">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isPositive ? "bg-green-100" : "bg-blue-100"}`}>
                          {isPositive
                            ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                            : <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {tx.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-blue-600"}`}>
                        {isPositive ? "+" : "-"}{Math.abs(tx.amount)} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Complete a survey to get started</p>
              </div>
            )}
          </Card>
        </div>

        {/* Referral Banner */}
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-accent text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Invite friends & earn more</h3>
                <p className="text-sm opacity-90">Earn 10% commission on every friend you refer</p>
              </div>
            </div>
            <Link href="/referrals">
              <Button variant="secondary" className="shrink-0">
                Get Referral Link
              </Button>
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
}
