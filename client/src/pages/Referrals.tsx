import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Copy, Share2, Users, TrendingUp, Gift, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Referrals() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: referral, isLoading: refLoading } = trpc.referral.getMyReferral.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: stats, isLoading: statsLoading } = trpc.referral.getReferralStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const [copied, setCopied] = useState(false);

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
            You need to sign in to access your referral dashboard.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleCopyLink = () => {
    if (referral?.referralUrl) {
      navigator.clipboard.writeText(referral.referralUrl);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Earn 10% commission on your referrals' earnings. Share your link and start earning!
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Referral Link Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-accent/10 to-blue-600/10 border-accent/20">
          <h2 className="text-2xl font-bold mb-6">Your Referral Link</h2>

          <div className="flex gap-2 mb-6">
            <Input
              value={referral?.referralUrl || ""}
              readOnly
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button onClick={handleCopyLink} variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="gap-2">
              <Share2 className="w-4 h-4" />
              Share on Social Media
            </Button>
            <Button variant="outline" className="gap-2">
              <Gift className="w-4 h-4" />
              Share via Email
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            💡 Tip: Share your referral link with friends and family. When they sign up and
            complete their first survey, you'll earn 10% of their earnings!
          </p>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Total Clicks</h3>
              <Share2 className="w-5 h-5 text-accent" />
            </div>
            <p className="text-4xl font-bold">{statsLoading ? "-" : stats?.totalClicks || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">People who clicked your link</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Signups</h3>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold">{statsLoading ? "-" : stats?.totalSignups || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">People who signed up</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Earnings</h3>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold">${statsLoading ? "-" : stats?.totalEarnings || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Your referral commission</p>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>

          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Share Your Link",
                description:
                  "Copy your unique referral link and share it with friends, family, or on social media.",
              },
              {
                step: "2",
                title: "They Sign Up",
                description:
                  "When someone signs up using your link, they'll be credited to your referral account.",
              },
              {
                step: "3",
                title: "They Complete Surveys",
                description:
                  "Your referral earns points by completing surveys on the platform.",
              },
              {
                step: "4",
                title: "You Earn Commission",
                description:
                  "You automatically earn 10% of their survey earnings. No limits on how much you can earn!",
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

        {/* FAQ */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "How much can I earn from referrals?",
                a: "You earn 10% of your referrals' survey earnings. There's no limit to how much you can earn!",
              },
              {
                q: "When do I get paid?",
                a: "Your referral earnings are added to your wallet immediately. You can redeem them anytime.",
              },
              {
                q: "Can I share my link anywhere?",
                a: "Yes! Share your link on social media, email, forums, or anywhere you think people might be interested.",
              },
              {
                q: "Do my referrals need to be active?",
                a: "Your referrals just need to sign up using your link. They earn you money whenever they complete surveys.",
              },
              {
                q: "Is there a limit to referrals?",
                a: "No! You can refer as many people as you want. The more you refer, the more you earn.",
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-border pb-6 last:border-b-0">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
