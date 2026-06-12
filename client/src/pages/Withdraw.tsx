import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, AlertCircle, CheckCircle } from "lucide-react";

export default function Withdraw() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: wallet } = trpc.wallet.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: requests } = trpc.withdrawal.getMyRequests.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"paypal" | "bank_transfer" | "gift_card">("paypal");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"amount" | "method" | "confirm">("amount");

  const submitWithdrawal = trpc.withdrawal.submit.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted!");
      setAmount("");
      setPaymentDetails({});
      setStep("amount");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
          <p className="text-muted-foreground mb-6">
            You need to sign in to withdraw your earnings.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentBalance = wallet?.currentBalance || 0;
  const amountNum = parseFloat(amount) || 0;
  const pointsNeeded = Math.ceil(amountNum * 100);
  const canWithdraw = pointsNeeded >= 500 && currentBalance >= pointsNeeded;

  const handleNext = () => {
    if (step === "amount") {
      if (!amount || amountNum < 5) {
        toast.error("Minimum withdrawal is $5");
        return;
      }
      if (currentBalance < pointsNeeded) {
        toast.error("Insufficient balance");
        return;
      }
      setStep("method");
    } else if (step === "method") {
      if (method === "paypal" && !paymentDetails.email) {
        toast.error("Please enter your PayPal email");
        return;
      }
      if (method === "bank_transfer" && (!paymentDetails.accountNumber || !paymentDetails.routingNumber)) {
        toast.error("Please enter your bank details");
        return;
      }
      setStep("confirm");
    }
  };

  const handleSubmit = () => {
    submitWithdrawal.mutate({
      amount: amountNum,
      method,
      paymentDetails,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">Withdraw Earnings</h1>
          <p className="text-muted-foreground">
            Convert your points to cash or gift cards
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {step === "amount" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Step 1: Amount</h2>
                    <p className="text-muted-foreground mb-6">
                      Enter the amount you want to withdraw (minimum $5)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="amount" className="mb-2 block">
                      Withdrawal Amount ($)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-xl">$</span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8"
                        min="5"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {amount && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p className="text-sm">
                        <strong>Amount:</strong> ${amountNum.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <strong>Points needed:</strong> {pointsNeeded}
                      </p>
                      <p className="text-sm">
                        <strong>Current balance:</strong> {currentBalance} points
                      </p>
                      {currentBalance >= pointsNeeded ? (
                        <p className="text-sm text-green-600">✓ Sufficient balance</p>
                      ) : (
                        <p className="text-sm text-red-600">
                          ✗ Insufficient balance ({currentBalance - pointsNeeded} points short)
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!canWithdraw}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {step === "method" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Step 2: Payment Method</h2>
                    <p className="text-muted-foreground mb-6">
                      Choose how you want to receive your withdrawal
                    </p>
                  </div>

                  <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)}>
                    {/* PayPal */}
                    <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-2 mb-3">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="font-semibold cursor-pointer">
                          PayPal
                        </Label>
                      </div>
                      {method === "paypal" && (
                        <div className="ml-6 space-y-3">
                          <Input
                            placeholder="PayPal email"
                            value={paymentDetails.email || ""}
                            onChange={(e) =>
                              setPaymentDetails({ ...paymentDetails, email: e.target.value })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Bank Transfer */}
                    <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-2 mb-3">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="font-semibold cursor-pointer">
                          Bank Transfer
                        </Label>
                      </div>
                      {method === "bank_transfer" && (
                        <div className="ml-6 space-y-3">
                          <Input
                            placeholder="Account number"
                            value={paymentDetails.accountNumber || ""}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                accountNumber: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Routing number"
                            value={paymentDetails.routingNumber || ""}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                routingNumber: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Account holder name"
                            value={paymentDetails.accountHolder || ""}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                accountHolder: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Gift Card */}
                    <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-2 mb-3">
                        <RadioGroupItem value="gift_card" id="gift_card" />
                        <Label htmlFor="gift_card" className="font-semibold cursor-pointer">
                          Gift Card
                        </Label>
                      </div>
                      {method === "gift_card" && (
                        <div className="ml-6 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Choose your preferred gift card in the next step
                          </p>
                        </div>
                      )}
                    </div>
                  </RadioGroup>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("amount")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button onClick={handleNext} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {step === "confirm" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Step 3: Confirm</h2>
                    <p className="text-muted-foreground mb-6">
                      Review your withdrawal details
                    </p>
                  </div>

                  <div className="bg-muted p-6 rounded-lg space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-2xl font-bold">${amountNum.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-semibold capitalize">{method.replace("_", " ")}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Points deducted</span>
                      <span className="font-semibold">{pointsNeeded} pts</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Remaining balance</span>
                      <span className="font-semibold">{currentBalance - pointsNeeded} pts</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Processing time</p>
                      <p className="text-sm text-blue-800">
                        Most withdrawals are processed within 24-48 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("method")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitWithdrawal.isPending}
                      className="flex-1"
                    >
                      {submitWithdrawal.isPending ? "Processing..." : "Confirm Withdrawal"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Balance Card */}
            <Card className="p-6 bg-gradient-to-br from-accent/10 to-blue-600/10">
              <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
              <p className="text-4xl font-bold mb-2">${(currentBalance * 0.01).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{currentBalance} points</p>
            </Card>

            {/* Recent Withdrawals */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Withdrawals</h3>
              {requests && requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.slice(0, 5).map((req) => (
                    <div key={req.id} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">${req.amount}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {req.status}
                        </p>
                      </div>
                      {req.status === "approved" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No withdrawals yet</p>
              )}
            </Card>

            {/* Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-3 text-blue-900">Withdrawal Info</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Minimum withdrawal: $5</li>
                <li>• Processing time: 24-48 hours</li>
                <li>• Conversion: 1 point = $0.01</li>
                <li>• No fees or hidden charges</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
