import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DollarSign, TrendingUp, ArrowDownCircle, ClipboardList, LogOut, Gift,
  User, Users, Settings as SettingsIcon, Shield,
} from "lucide-react";
import { toast } from "sonner";

function cents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: wallet, isLoading } = trpc.wallet.summary.useQuery();
  const { data: history } = trpc.wallet.history.useQuery({ limit: 5 });
  const { data: checkin, isLoading: checkinLoading } = trpc.user.getCheckinStatus.useQuery();
  const utils = trpc.useUtils();

  const dailyCheckin = trpc.user.dailyCheckin.useMutation({
    onSuccess: (data) => {
      toast.success(`Checked in! +${cents(data.rewardCents)} added to your balance.`);
      utils.user.getCheckinStatus.invalidate();
      utils.wallet.summary.invalidate();
      utils.wallet.history.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const quickLinks = [
    { href: "/surveys", label: "Surveys", icon: ClipboardList, color: "text-indigo-600 bg-indigo-100" },
    { href: "/wallet", label: "Wallet", icon: DollarSign, color: "text-green-600 bg-green-100" },
    { href: "/withdraw", label: "Withdraw", icon: ArrowDownCircle, color: "text-orange-600 bg-orange-100" },
    { href: "/rewards", label: "Rewards", icon: Gift, color: "text-pink-600 bg-pink-100" },
    { href: "/referrals", label: "Referrals", icon: Users, color: "text-purple-600 bg-purple-100" },
    { href: "/profile", label: "Profile", icon: User, color: "text-blue-600 bg-blue-100" },
    { href: "/settings", label: "Settings", icon: SettingsIcon, color: "text-gray-600 bg-gray-100" },
  ];

  if (user?.role === "admin") {
    quickLinks.push({ href: "/admin", label: "Admin", icon: Shield, color: "text-red-600 bg-red-100" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">SurveyEarn Pro</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name ?? user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Available Balance</CardTitle>
              <DollarSign className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">
                {isLoading ? "—" : cents(wallet?.balanceCents ?? 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earned</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {isLoading ? "—" : cents(wallet?.totalEarnedCents ?? 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Withdrawn</CardTitle>
              <ArrowDownCircle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {isLoading ? "—" : cents(wallet?.totalWithdrawnCents ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between py-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Daily Check-in Bonus
                  {checkin?.streakCount ? (
                    <span className="ml-2 text-xs font-normal text-orange-500">
                      🔥 {checkin.streakCount}-day streak
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-400">
                  {checkinLoading
                    ? "Loading..."
                    : checkin?.canCheckin
                    ? `Claim ${cents(checkin?.rewardCents ?? 10)} for free, once every 24 hours`
                    : checkin?.nextCheckinAt
                    ? `Next check-in available at ${new Date(checkin.nextCheckinAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={checkinLoading || !checkin?.canCheckin || dailyCheckin.isPending}
              onClick={() => dailyCheckin.mutate()}
            >
              {dailyCheckin.isPending
                ? "Claiming..."
                : checkin?.canCheckin
                ? "Check In"
                : "Already Claimed"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-shadow cursor-pointer">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!history?.length ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No transactions yet. Complete a survey to start earning!
              </p>
            ) : (
              <ul className="divide-y">
                {history.map((tx) => (
                  <li key={tx.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`font-semibold text-sm ${
                        tx.amountCents >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {tx.amountCents >= 0 ? "+" : ""}
                      {cents(tx.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}