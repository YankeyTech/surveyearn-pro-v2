import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

function cents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

const typeLabel: Record<string, string> = {
  survey_credit: "Survey Reward",
  withdrawal_debit: "Withdrawal",
  adjustment: "Adjustment",
};

export default function Wallet() {
  const { data: wallet } = trpc.wallet.summary.useQuery();
  const { data: history, isLoading } = trpc.wallet.history.useQuery({ limit: 100 });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Transaction History</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Balance", val: wallet?.balanceCents ?? 0, color: "text-indigo-600" },
            { label: "Total Earned", val: wallet?.totalEarnedCents ?? 0, color: "text-green-600" },
            { label: "Withdrawn", val: wallet?.totalWithdrawnCents ?? 0, color: "text-orange-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <p className={`text-2xl font-bold ${s.color}`}>{cents(s.val)}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transaction list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !history?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">No transactions yet.</p>
            ) : (
              <ul className="divide-y">
                {history.map((tx) => (
                  <li key={tx.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{typeLabel[tx.type] ?? tx.type}</p>
                      {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-semibold text-sm ${
                          tx.amountCents >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {tx.amountCents >= 0 ? "+" : ""}
                        {cents(tx.amountCents)}
                      </span>
                      <p className="text-xs text-gray-400 capitalize">{tx.status}</p>
                    </div>
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
