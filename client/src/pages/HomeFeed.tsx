import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
 DollarSign, TrendingUp, ArrowDownCircle, ClipboardList, LogOut, Gift,
  User, Users, Settings as SettingsIcon, Shield, Menu, X,
  Sparkles, Megaphone, PlayCircle, ShoppingBag, Star, Bell, ChevronRight,
  Wallet, Trophy, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function cents(c: number) {
  return "$" + (c / 100).toFixed(2);
}

export default function HomeFeed() {
  const { user, logout } = useAuth();
  const { data: wallet, isLoading } = trpc.wallet.summary.useQuery();
  const { data: history } = trpc.wallet.history.useQuery({ limit: 5 });
  const { data: checkin, isLoading: checkinLoading } = trpc.user.getCheckinStatus.useQuery();
  const utils = trpc.useUtils();
  const [menuOpen, setMenuOpen] = useState(false);

  const dailyCheckin = trpc.user.dailyCheckin.useMutation({
    onSuccess: (data) => {
      toast.success("+" + cents(data.rewardCents) + " added! " + (data.streakCount > 1 ? data.streakCount + "-day streak!" : ""));
      utils.user.getCheckinStatus.invalidate();
      utils.wallet.summary.invalidate();
      utils.wallet.history.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const navLinks = [
    { href: "/home-feed", label: "Home" },
    { href: "/surveys", label: "Surveys" },
{ href: "/offers", label: "Offers" },
    { href: "/wallet", label: "Wallet" },
    { href: "/rewards", label: "Rewards" },
    { href: "/referrals", label: "Referrals" },
    { href: "/withdraw", label: "Withdraw" },
    { href: "/profile", label: "Profile" },
    { href: "/settings", label: "Settings" },
  ];
  if (user?.role === "admin") navLinks.push({ href: "/admin", label: "Admin" });

  const featuredOffers = [
    {
      title: "CPX Research",
      desc: "Earn up to $5 per survey",
      icon: ClipboardList,
      gradient: "from-violet-600 to-indigo-600",
      href: "/surveys",
      badge: "LIVE",
      badgeColor: "bg-green-400 text-green-900",
    },
    {
      title: "Video Offers",
      desc: "Watch and earn rewards",
      icon: PlayCircle,
      gradient: "from-rose-500 to-pink-600",
      href: "/surveys",
      badge: "SOON",
      badgeColor: "bg-white/30 text-white",
    },
    {
      title: "Shopping Tasks",
      desc: "Cash back on purchases",
      icon: ShoppingBag,
      gradient: "from-emerald-500 to-teal-600",
      href: "/surveys",
      badge: "SOON",
      badgeColor: "bg-white/30 text-white",
    },
    {

      title: "CPALead Offers",
      desc: "Complete offers and earn cash",
      icon: Tag,
      gradient: "from-orange-500 to-amber-500",
      href: "/offers",
      badge: "LIVE",
      badgeColor: "bg-green-400 text-green-900",
    },
{
      title: "Sponsored Ads",
      desc: "Earn by engaging with brands",
      icon: Megaphone,
      gradient: "from-amber-500 to-orange-500",
      href: "/sponsored-ads",
      badge: "LIVE",
      badgeColor: "bg-green-400 text-green-900",
    },
  ];

  const quickLinks = [
    { href: "/surveys", label: "Surveys", icon: ClipboardList, bg: "bg-violet-100", fg: "text-violet-600" },
{ href: "/offers", label: "Offers", icon: Tag, bg: "bg-orange-100", fg: "text-orange-600" },
    { href: "/wallet", label: "Wallet", icon: Wallet, bg: "bg-green-100", fg: "text-green-600" },
    { href: "/withdraw", label: "Withdraw", icon: ArrowDownCircle, bg: "bg-orange-100", fg: "text-orange-600" },
    { href: "/rewards", label: "Rewards", icon: Trophy, bg: "bg-pink-100", fg: "text-pink-600" },
    { href: "/referrals", label: "Referrals", icon: Users, bg: "bg-purple-100", fg: "text-purple-600" },
    { href: "/profile", label: "Profile", icon: User, bg: "bg-blue-100", fg: "text-blue-600" },
    { href: "/settings", label: "Settings", icon: SettingsIcon, bg: "bg-gray-100", fg: "text-gray-600" },
  ];
  if (user?.role === "admin") {
    quickLinks.push({ href: "/admin", label: "Admin", icon: Shield, bg: "bg-red-100", fg: "text-red-600" });
  }

  const checkinLabel = () => {
    if (checkinLoading) return "Loading...";
    if (checkin?.canCheckin) return "Claim your free " + cents(checkin.rewardCents) + " once every 24 hours";
    if (checkin?.nextCheckinAt) {
      return "Next reward at " + new Date(checkin.nextCheckinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb]">

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home-feed">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline">
                SurveyEarn Pro
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-600 hover:bg-violet-50 font-medium">
                  {l.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5">
              <DollarSign className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-sm font-bold text-violet-700">
                {isLoading ? "..." : cents(wallet?.balanceCents ?? 0)}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-violet-600">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-500">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Logout</span>
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700" onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Button>
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-500" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        )}
      </header>
<section className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Welcome back</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-1">
                {user?.name ? "Hi, " + user.name + "!" : "Welcome back!"}
              </h1>
              <p className="text-white/70 text-sm">Here is what is waiting for you today.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Balance", value: isLoading ? "..." : cents(wallet?.balanceCents ?? 0), icon: DollarSign },
                { label: "Earned", value: isLoading ? "..." : cents(wallet?.totalEarnedCents ?? 0), icon: TrendingUp },
                { label: "Withdrawn", value: isLoading ? "..." : cents(wallet?.totalWithdrawnCents ?? 0), icon: ArrowDownCircle },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 text-center min-w-[90px]">
                    <Icon className="w-4 h-4 mx-auto mb-1 opacity-70" />
                    <p className="text-lg md:text-xl font-bold">{s.value}</p>
                    <p className="text-xs opacity-60">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <p className="font-bold text-base">
                Daily Check-in Bonus
                {(checkin?.streakCount ?? 0) > 0 && (
                  <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5 font-normal">
                    {checkin!.streakCount}-day streak
                  </span>
                )}
              </p>
              <p className="text-sm text-white/80 mt-0.5">{checkinLabel()}</p>
            </div>
          </div>
          <Button
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-sm flex-shrink-0"
            disabled={checkinLoading || !checkin?.canCheckin || dailyCheckin.isPending}
            onClick={() => dailyCheckin.mutate()}
          >
            {dailyCheckin.isPending ? "Claiming..." : checkin?.canCheckin ? "Claim Now" : "Claimed"}
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-lg font-bold text-gray-800">Featured Offers</h2>
            </div>
            <Link href="/surveys">
              <Button variant="ghost" size="sm" className="text-violet-600 gap-1 text-sm">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredOffers.map((offer) => {
              const Icon = offer.icon;
              return (
                <Link key={offer.title} href={offer.href}>
                  <div className={"relative rounded-2xl p-5 h-44 flex flex-col justify-between text-white bg-gradient-to-br " + offer.gradient + " cursor-pointer hover:scale-[1.02] transition-transform shadow-md overflow-hidden"}>
                    <div className="absolute inset-0 opacity-10 bg-white rounded-2xl" />
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={"text-xs font-bold rounded-full px-2.5 py-1 " + offer.badgeColor}>
                        {offer.badge}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">{offer.title}</p>
                      <p className="text-xs text-white/70 mt-0.5">{offer.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Access</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={"w-14 h-14 rounded-2xl " + item.bg + " flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all"}>
                      <Icon className={"w-6 h-6 " + item.fg} />
                    </div>
                    <span className="text-xs text-gray-600 font-medium text-center leading-tight">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white/80" />
            </div>
            <div>
              <p className="font-bold">Partner Ads and Sponsored Content</p>
              <p className="text-sm text-white/60">This space will display live ads and partner offers</p>
            </div>
          </div>
          <span className="text-xs text-white/40 border border-white/20 rounded-full px-3 py-1">Ad Space</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
            <Link href="/wallet">
              <Button variant="ghost" size="sm" className="text-violet-600 gap-1 text-sm">
                See all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {!history?.length ? (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No activity yet. Complete a survey to start earning!</p>
                  <Link href="/surveys">
                    <Button className="mt-4 bg-violet-600 hover:bg-violet-700 text-sm">Take a Survey</Button>
                  </Link>
                </div>
              ) : (
                <ul>
                  {history.map((tx, i) => (
                    <li key={tx.id} className={"flex justify-between items-center px-5 py-4 " + (i !== history.length - 1 ? "border-b" : "")}>
                      <div className="flex items-center gap-3">
                        <div className={"w-9 h-9 rounded-xl flex items-center justify-center " + (tx.amountCents >= 0 ? "bg-green-100" : "bg-red-100")}>
                          {tx.amountCents >= 0
                            ? <TrendingUp className="w-4 h-4 text-green-600" />
                            : <ArrowDownCircle className="w-4 h-4 text-red-500" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 capitalize">
                            {tx.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <span className={"font-bold text-sm " + (tx.amountCents >= 0 ? "text-green-600" : "text-red-500")}>
                        {tx.amountCents >= 0 ? "+" : ""}{cents(tx.amountCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

      </main>

      <footer className="mt-10 border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400">
          <span>2026 SurveyEarn Pro. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-violet-600">Privacy</a>
            <a href="#" className="hover:text-violet-600">Terms</a>
            <a href="#" className="hover:text-violet-600">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


