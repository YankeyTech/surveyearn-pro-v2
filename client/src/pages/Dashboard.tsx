import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DollarSign, TrendingUp, ArrowDownCircle, ClipboardList, LogOut } from "lucide-react";

function cents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: wallet, isLoading } = trpc.wallet.summary.useQuery();
  const { data: history } = trpc.wallet.history.useQuery({ limit: 5 });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">SurveyEarn Pro</h1>
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
