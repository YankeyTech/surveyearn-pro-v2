import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const MIN_CENTS = 500; // $5.00

function cents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default function Withdraw() {
  const { data: wallet } = trpc.wallet.summary.useQuery();
  const { data: myWithdrawals } = trpc.withdrawal.myList.useQuery();
  const utils = trpc.useUtils();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mobile_money" | "bank_transfer" | "paypal">("mobile_money");
  const [accountDetails, setAccountDetails] = useState("");
  const [done, setDone] = useState(false);

  const requestMutation = trpc.withdrawal.request.useMutation({
    onSuccess: () => {
      utils.wallet.summary.invalidate();
      utils.withdrawal.myList.invalidate();
      setDone(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const balance = wallet?.balanceCents ?? 0;

  function handleSubmit() {
    if (amountCents < MIN_CENTS) {
      toast.error(`Minimum withdrawal is ${cents(MIN_CENTS)}`);
      return;
    }
    if (amountCents > balance) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    if (!accountDetails.trim()) {
      toast.error("Please provide account details");
      return;
    }
    requestMutation.mutate({ amountCents, method, accountDetails });
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-800">Request Submitted!</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Your withdrawal request is under review. You'll be notified once it's processed (usually within 1–3 business days).
        </p>
        <Link href="/">
          <Button className="mt-2">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Withdraw Earnings</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-indigo-600">{cents(balance)}</p>
            <p className="text-xs text-gray-400 mt-1">Minimum withdrawal: {cents(MIN_CENTS)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <input
                type="number"
                min="5"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 10.00"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Details
              </label>
              <textarea
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                rows={3}
                placeholder={
                  method === "mobile_money"
                    ? "Phone number + network (e.g. 024XXXXXXX · MTN Ghana)"
                    : method === "bank_transfer"
                    ? "Bank name, account number, account name"
                    : "PayPal email address"
                }
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </CardContent>
        </Card>

        {/* Past withdrawal requests */}
        {!!myWithdrawals?.length && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {myWithdrawals.map((w) => (
                  <li key={w.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{cents(w.amountCents)}</p>
                      <p className="text-xs text-gray-400 capitalize">{w.method.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(w.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                        w.status === "approved" || w.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : w.status === "rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {w.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
