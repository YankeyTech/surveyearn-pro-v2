
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link, Redirect } from "wouter";
import {
  BarChart3,
  Gift,
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Zap className="w-8 h-8 text-accent" />
        </div>
      </div>
    );
  }
if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">SurveyEarn Pro</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/surveys">
                  <Button variant="ghost">Surveys</Button>
                </Link>
                <Link href="/wallet">
                  <Button variant="ghost">Wallet</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost">Settings</Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button>Get Started</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-card">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Earn Real Money
              <span className="gradient-text"> Completing Surveys</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join thousands of users earning rewards by sharing your opinions. Get paid in cash,
              gift cards, or PayPal transfers. It's simple, secure, and rewarding.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="gap-2">
                      Start Earning Now <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <Link href="/surveys">
                  <Button size="lg" className="gap-2">
                    Browse Surveys <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-16 pt-16 border-t border-border">
              <div>
                <div className="text-3xl font-bold text-accent">50K+</div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">$2M+</div>
                <p className="text-sm text-muted-foreground">Paid Out</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">1000+</div>
                <p className="text-sm text-muted-foreground">Surveys</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Sign Up",
                description: "Create your free account in seconds with email or social login.",
              },
              {
                icon: BarChart3,
                title: "Complete Surveys",
                description: "Browse available surveys and share your honest opinions.",
              },
              {
                icon: TrendingUp,
                title: "Earn Points",
                description: "Get instant points for each survey you complete.",
              },
              {
                icon: Gift,
                title: "Redeem Rewards",
                description: "Convert points to cash, gift cards, or PayPal transfers.",
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Rewards */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Popular Rewards</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Amazon Gift Card", value: "$10", points: "1000" },
              { name: "PayPal Cash", value: "$25", points: "2500" },
              { name: "Starbucks Card", value: "$5", points: "500" },
            ].map((reward, idx) => (
              <Card key={idx} className="p-8 text-center hover:shadow-lg transition-shadow">
                <Gift className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">{reward.name}</h3>
                <p className="text-3xl font-bold text-accent mb-4">{reward.value}</p>
                <p className="text-sm text-muted-foreground mb-6">{reward.points} points</p>
                {isAuthenticated && (
                  <Link href="/rewards">
                    <Button variant="outline" className="w-full">
                      Redeem
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose SurveyEarn Pro?</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: "100% Secure & Trusted",
                description: "Your data is protected with industry-leading security. We never share your information.",
              },
              {
                title: "Fast Payouts",
                description: "Get paid within 24-48 hours. Choose PayPal, bank transfer, or gift cards.",
              },
              {
                title: "Flexible Rewards",
                description: "Redeem for cash, gift cards, or donate to charity. Your choice.",
              },
              {
                title: "Referral Bonuses",
                description: "Earn 10% commission on your referrals' earnings. Unlimited potential.",
              },
              {
                title: "No Spam",
                description: "Only relevant surveys matched to your profile. No spam or scams.",
              },
              {
                title: "24/7 Support",
                description: "Our support team is always ready to help with any questions.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent to-blue-600">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already earning money by completing surveys. Sign up
            today and get your first survey within minutes.
          </p>

          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "How much can I earn?",
                a: "Earnings vary based on survey complexity and length. Most surveys pay between $0.50 and $5. Top earners make $200+ per month.",
              },
              {
                q: "Is it really free?",
                a: "Yes! SurveyEarn Pro is completely free to join and use. We make money through our survey partners.",
              },
              {
                q: "How do I get paid?",
                a: "You can redeem your points for PayPal transfers, bank transfers, or gift cards. Minimum withdrawal is $5.",
              },
              {
                q: "How long does it take to get paid?",
                a: "Most withdrawals are processed within 24-48 hours. PayPal transfers are usually instant.",
              },
            ].map((item, idx) => (
              <div key={idx} className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">SurveyEarn Pro</h3>
              <p className="text-sm text-muted-foreground">
                Earn real money by completing surveys. Join our community today.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Surveys
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Rewards
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2026 SurveyEarn Pro. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Twitter
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Facebook
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
