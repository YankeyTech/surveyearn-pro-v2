import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DollarSign, TrendingUp, ArrowDownCircle, ClipboardList, LogOut, Gift, ArrowLeft } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-indigo-600">SurveyEarn Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name ?? user?.email}</span>
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Stats row */}
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

        {/* Daily Check-in */}
        <Card>
          <CardContent className="flex items-center justify-between py-5">
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

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/surveys">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <ClipboardList className="w-4 h-4 mr-2" /> Take Surveys
            </Button>
          </Link>
          <Link href="/withdraw">
            <Button variant="outline">
              <ArrowDownCircle className="w-4 h-4 mr-2" /> Withdraw
            </Button>
          </Link>
          <Link href="/wallet">
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" /> Transaction History
            </Button>
          </Link>
        </div>

        {/* Recent transactions */}
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