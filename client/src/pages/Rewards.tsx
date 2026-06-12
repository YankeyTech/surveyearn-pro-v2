import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Gift, Zap, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const REWARDS = [
  {
    id: "amazon_5",
    name: "Amazon Gift Card",
    value: "$5",
    points: 500,
    icon: "🛍️",
  },
  {
    id: "amazon_10",
    name: "Amazon Gift Card",
    value: "$10",
    points: 1000,
    icon: "🛍️",
  },
  {
    id: "amazon_25",
    name: "Amazon Gift Card",
    value: "$25",
    points: 2500,
    icon: "🛍️",
  },
  {
    id: "paypal_5",
    name: "PayPal Cash",
    value: "$5",
    points: 500,
    icon: "💰",
  },
  {
    id: "paypal_10",
    name: "PayPal Cash",
    value: "$10",
    points: 1000,
    icon: "💰",
  },
  {
    id: "paypal_25",
    name: "PayPal Cash",
    value: "$25",
    points: 2500,
    icon: "💰",
  },
  {
    id: "starbucks_5",
    name: "Starbucks Card",
    value: "$5",
    points: 500,
    icon: "☕",
  },
  {
    id: "itunes_10",
    name: "iTunes Gift Card",
    value: "$10",
    points: 1000,
    icon: "🎵",
  },
  {
    id: "netflix_month",
    name: "Netflix 1 Month",
    value: "1 Month",
    points: 1500,
    icon: "🎬",
  },
  {
    id: "spotify_month",
    name: "Spotify Premium",
    value: "1 Month",
    points: 1500,
    icon: "🎧",
  },
];

export default function Rewards() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: wallet } = trpc.wallet.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [selectedReward, setSelectedReward] = useState<(typeof REWARDS)[0] | null>(null);
  const [email, setEmail] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

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
            You need to sign in to redeem rewards.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleRedeem = async () => {
    if (!selectedReward) return;

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsRedeeming(true);
    try {
      // Simulate redemption
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${selectedReward.name} redeemed! Check your email for details.`);
      setSelectedReward(null);
      setEmail("");
    } catch (error) {
      toast.error("Failed to redeem reward");
    } finally {
      setIsRedeeming(false);
    }
  };

  const currentBalance = wallet?.currentBalance || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">Redeem Rewards</h1>
          <p className="text-muted-foreground">
            Choose from our selection of gift cards and cash rewards
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Balance Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-accent/10 to-blue-600/10 border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Points</p>
              <p className="text-4xl font-bold">{currentBalance} pts</p>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ ${(currentBalance * 0.01).toFixed(2)}
              </p>
            </div>
            <Gift className="w-12 h-12 text-accent opacity-50" />
          </div>
        </Card>

        {/* Rewards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REWARDS.map((reward) => {
            const canRedeem = currentBalance >= reward.points;

            return (
              <Card
                key={reward.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  !canRedeem ? "opacity-50" : ""
                }`}
                onClick={() => canRedeem && setSelectedReward(reward)}
              >
                <div className="text-4xl mb-4">{reward.icon}</div>

                <h3 className="text-lg font-semibold mb-1">{reward.name}</h3>
                <p className="text-2xl font-bold text-accent mb-4">{reward.value}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{reward.points} points</span>
                  {canRedeem && <Check className="w-5 h-5 text-green-500" />}
                </div>

                <Button
                  className="w-full"
                  disabled={!canRedeem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReward(reward);
                  }}
                >
                  {canRedeem ? "Redeem" : "Not enough points"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="p-8 mt-12">
          <h2 className="text-2xl font-bold mb-6">How Redemption Works</h2>

          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Select a Reward",
                description: "Choose from our wide selection of gift cards and cash rewards.",
              },
              {
                step: "2",
                title: "Confirm Your Details",
                description: "Enter your email address where you'll receive the reward details.",
              },
              {
                step: "3",
                title: "Instant Delivery",
                description:
                  "Most rewards are delivered instantly. Some may take up to 24 hours.",
              },
              {
                step: "4",
                title: "Enjoy Your Reward",
                description: "Use your reward code or link to claim your gift card or cash.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {selectedReward?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <p className="text-center text-3xl font-bold text-accent mb-2">
                {selectedReward?.value}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {selectedReward?.points} points
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your reward will be sent to this email address
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Points to be deducted:</strong> {selectedReward?.points}
              </p>
              <p className="text-sm mt-2">
                <strong>Remaining points:</strong>{" "}
                {Math.max(0, (currentBalance || 0) - (selectedReward?.points || 0))}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedReward(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRedeem}
                disabled={isRedeeming || !email}
              >
                {isRedeeming ? "Processing..." : "Confirm Redemption"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
