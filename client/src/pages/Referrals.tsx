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
  const { data: referral, isLoading: refLoading } = trpc.referral.getMyReferralInfo.useQuery(
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
    if (referral?.referralLink) {
      navigator.clipboard.writeText(referral.referralLink);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (referral?.referralLink) {
      const msg = encodeURIComponent(`Join SurveyEarn Pro and earn real money! Sign up with my link and get a $0.25 bonus: ${referral.referralLink}`);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
  };

  const handleShareEmail = () => {
    if (referral?.referralLink) {
      const subject = encodeURIComponent("Join SurveyEarn Pro — Earn Real Money!");
      const body = encodeURIComponent(`Hey!\n\nI've been using SurveyEarn Pro to earn money by completing surveys. Sign up with my link and get a $0.25 welcome bonus:\n\n${referral.referralLink}\n\nSee you there!`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Earn <strong>$0.50</strong> for every friend you invite. They get <strong>$0.25</strong> too!
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Referral Link Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-accent/10 to-blue-600/10 border-accent/20">
          <h2 className="text-2xl font-bold mb-2">Your Referral Link</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Share this link — you earn $0.50 and your friend gets $0.25 on signup.
          </p>

          <div className="flex gap-2 mb-6">
            <Input
              value={refLoading ? "Loading..." : referral?.referralLink ?? ""}
              readOnly
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button onClick={handleCopyLink} variant="outline" className="gap-2" disabled={refLoading}>
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="gap-2" onClick={handleShareWhatsApp}>
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleShareEmail}>
              <Gift className="w-4 h-4" />
              Share via Email
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Your Code</h3>
              <Copy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-bold font-mono">
              {refLoading ? "—" : referral?.referralCode ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Your unique referral code</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Signups</h3>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold">
              {refLoading ? "—" : referral?.totalReferrals ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Friends who signed up</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Earned</h3>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold">
              ${refLoading ? "—" : ((referral?.totalEarnedCents ?? 0) / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Total referral earnings</p>
          </Card>
        </div>

        {/* Referrals Table */}
        {referral?.referrals && referral.referrals.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Your Referrals</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground">Email</th>
                    <th className="text-left py-2 text-muted-foreground">Joined</th>
                    <th className="text-left py-2 text-muted-foreground">Bonus Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {referral.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-3">{r.email}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        {r.referralBonusPaid
                          ? <span className="text-green-500 font-medium">✓ $0.50 paid</span>
                          : <span className="text-muted-foreground">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* How It Works */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Share Your Link", description: "Copy your unique referral link and share it with friends or on social media." },
              { step: "2", title: "Friend Signs Up", description: "When someone registers using your link, they get a $0.25 welcome bonus instantly." },
              { step: "3", title: "You Get Paid", description: "You automatically receive $0.50 added to your wallet — no minimums, no waiting." },
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
              { q: "How much do I earn per referral?", a: "You earn $0.50 for every friend who signs up using your link. They also get a $0.25 welcome bonus." },
              { q: "When do I get paid?", a: "Your $0.50 bonus is added to your wallet instantly when your friend completes registration." },
              { q: "Is there a limit to referrals?", a: "No! Refer as many people as you want. There's no cap on referral earnings." },
              { q: "Can I share my link anywhere?", a: "Yes — social media, WhatsApp, email, forums, anywhere you like." },
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