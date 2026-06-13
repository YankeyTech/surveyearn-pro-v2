import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

function cents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default function Admin() {
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: pending, isLoading } = trpc.admin.pendingWithdrawals.useQuery();
  const utils = trpc.useUtils();

  const [noteMap, setNoteMap] = useState<Record<number, string>>({});

  const approveMutation = trpc.admin.approveWithdrawal.useMutation({
    onSuccess: () => {
      utils.admin.pendingWithdrawals.invalidate();
      utils.admin.stats.invalidate();
      toast.success("Withdrawal approved");
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.admin.rejectWithdrawal.useMutation({
    onSuccess: () => {
      utils.admin.pendingWithdrawals.invalidate();
      utils.admin.stats.invalidate();
      toast.success("Withdrawal rejected and balance refunded");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.totalUsers.toString() },
              { label: "Total Earned", val: cents(stats.totalEarnedCents) },
              { label: "Total Withdrawn", val: cents(stats.totalWithdrawnCents) },
              { label: "Pending Payouts", val: cents(stats.pendingWithdrawalsCents) },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-bold text-gray-800">{s.val}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pending withdrawals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending Withdrawals{" "}
              {pending?.length ? (
                <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !pending?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">No pending withdrawals.</p>
            ) : (
              <ul className="divide-y">
                {pending.map(({ withdrawal: w, user }) => (
                  <li key={w.id} className="py-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{cents(w.amountCents)}</p>
                        <p className="text-sm text-gray-500">
                          {user?.name ?? "Unknown"} · {user?.email}
                        </p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {w.method.replace(/_/g, " ")} ·{" "}
                          {new Date(w.requestedAt).toLocaleString()}
                        </p>
                        <p className="text-xs bg-gray-100 rounded px-2 py-1 mt-1 font-mono">
                          {w.accountDetails}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={noteMap[w.id] ?? ""}
                        onChange={(e) =>
                          setNoteMap((prev) => ({ ...prev, [w.id]: e.target.value }))
                        }
                        className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={approveMutation.isPending}
                        onClick={() =>
                          approveMutation.mutate({
                            withdrawalId: w.id,
                            note: noteMap[w.id],
                          })
                        }
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-600 hover:bg-red-50"
                        disabled={rejectMutation.isPending}
                        onClick={() =>
                          rejectMutation.mutate({
                            withdrawalId: w.id,
                            note: noteMap[w.id],
                          })
                        }
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
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
