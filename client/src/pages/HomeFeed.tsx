import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  TrendingUp, ArrowDownCircle, ClipboardList, LogOut, Gift,
  User, Users, Settings as SettingsIcon, Shield, Menu, X,
  Sparkles, Megaphone, PlayCircle, ShoppingBag, Bell, ChevronRight,
  Wallet, Trophy, Tag, Flame, Zap, Star, CheckCircle2, Circle,
  Coins, BarChart3, ArrowUpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Virtual currency: 1 cent = 10 EP (Earn Points)
function toEP(cents: number) {
  return (cents * 10).toLocaleString() + " EP";
}
function toDollars(cents: number) {
  return "$" + (cents / 100).toFixed(2);
}

// Social proof ticker data
const TICKER_EVENTS = [
  { user: "Kof***i", amount: "$12.50", action: "withdrew" },
  { user: "Ama***a", amount: "$5.00",  action: "earned from surveys" },
  { user: "Kwe***e", amount: "$3.25",  action: "earned from offers" },
  { user: "Afi***a", amount: "$20.00", action: "withdrew" },
  { user: "Yaw***i", amount: "$1.50",  action: "earned daily bonus" },
  { user: "Esi***m", amount: "$8.75",  action: "earned from referrals" },
];

export default function HomeFeed() {
  const { user, logout } = useAuth();
  const { data: wallet, isLoading } = trpc.wallet.summary.useQuery();
  const { data: history } = trpc.wallet.history.useQuery({ limit: 5 });
  const { data: checkin, isLoading: checkinLoading } = trpc.user.getCheckinStatus.useQuery();
  const utils = trpc.useUtils();
  const [menuOpen, setMenuOpen] = useState(false);

  const dailyCheckin = trpc.user.dailyCheckin.useMutation({
    onSuccess: (data) => {
      toast.success(`+${toEP(data.rewardCents)} added! ${data.streakCount > 1 ? `${data.streakCount}-day streak! 🔥` : ""}`);
      utils.user.getCheckinStatus.invalidate();
      utils.wallet.summary.invalidate();
      utils.wallet.history.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const streak = checkin?.streakCount ?? 0;
  const balance = wallet?.balanceCents ?? 0;
  const totalEarned = wallet?.totalEarnedCents ?? 0;

  // Daily goal: $1.00 = 100 cents target
  const dailyGoalCents = 100;
  const todayEarned = history?.filter(tx => {
    const today = new Date().toDateString();
    return new Date(tx.createdAt).toDateString() === today && tx.amountCents > 0;
  }).reduce((s, t) => s + t.amountCents, 0) ?? 0;
  const goalPct = Math.min(100, Math.round((todayEarned / dailyGoalCents) * 100));

  // Daily tasks
  const dailyTasks = [
    { label: "Daily Check-in", done: !checkin?.canCheckin, pts: "100 EP" },
    { label: "Complete 1 Survey", done: (history ?? []).some(tx => tx.type === "survey_credit"), pts: "500 EP" },
    { label: "Refer a Friend", done: false, pts: "250 EP" },
  ];
  const tasksDone = dailyTasks.filter(t => t.done).length;

  const navLinks = [
    { href: "/home-feed", label: "Home" },
    { href: "/surveys",   label: "Surveys" },
    { href: "/offers",    label: "Offers" },
    { href: "/wallet",    label: "Wallet" },
    { href: "/rewards",   label: "Rewards" },
    { href: "/referrals", label: "Referrals" },
    { href: "/withdraw",  label: "Withdraw" },
    { href: "/profile",   label: "Profile" },
  ];
  if (user?.role === "admin") navLinks.push({ href: "/admin", label: "Admin" });

  const featuredOffers = [
    { title: "CPX Research", desc: "Up to 500 EP per survey", icon: ClipboardList, gradient: "from-violet-600 to-indigo-600", href: "/surveys", badge: "HOT 🔥", live: true },
    { title: "CPALead Offers", desc: "Complete offers, earn big", icon: Tag, gradient: "from-orange-500 to-amber-500", href: "/offers", badge: "LIVE", live: true },
    { title: "Sponsored Ads", desc: "Engage with brands", icon: Megaphone, gradient: "from-teal-500 to-cyan-600", href: "/sponsored-ads", badge: "LIVE", live: true },
    { title: "Video Offers", desc: "Watch & earn EP", icon: PlayCircle, gradient: "from-rose-500 to-pink-600", href: "/surveys", badge: "SOON", live: false },
    { title: "Shopping Cashback", desc: "Cash back on purchases", icon: ShoppingBag, gradient: "from-emerald-500 to-green-600", href: "/surveys", badge: "SOON", live: false },
  ];

  const offerRows = [
    {
      title: "Answer Surveys & Earn",
      icon: BarChart3,
      color: "text-violet-600",
      items: [
        { name: "Short Survey", time: "5 min", ep: "150 EP", color: "bg-violet-50 border-violet-200" },
        { name: "Opinion Poll",  time: "2 min", ep: "50 EP",  color: "bg-indigo-50 border-indigo-200" },
        { name: "Product Review", time: "8 min", ep: "300 EP", color: "bg-purple-50 border-purple-200" },
        { name: "Lifestyle Survey", time: "10 min", ep: "500 EP", color: "bg-fuchsia-50 border-fuchsia-200" },
      ],
      href: "/surveys",
    },
    {
      title: "Discover Special Offers",
      icon: Sparkles,
      color: "text-orange-600",
      items: [
        { name: "Sign Up Bonus",   time: "1 min",  ep: "200 EP",  color: "bg-orange-50 border-orange-200" },
        { name: "App Download",    time: "3 min",  ep: "400 EP",  color: "bg-amber-50 border-amber-200" },
        { name: "Trial Offer",     time: "5 min",  ep: "750 EP",  color: "bg-yellow-50 border-yellow-200" },
        { name: "Newsletter Sub",  time: "1 min",  ep: "100 EP",  color: "bg-lime-50 border-lime-200" },
      ],
      href: "/offers",
    },
  ];

  const quickLinks = [
    { href: "/surveys",   label: "Surveys",  icon: ClipboardList, bg: "bg-violet-100", fg: "text-violet-600" },
    { href: "/offers",    label: "Offers",   icon: Tag,            bg: "bg-orange-100", fg: "text-orange-600" },
    { href: "/wallet",    label: "Wallet",   icon: Wallet,         bg: "bg-green-100",  fg: "text-green-600" },
    { href: "/withdraw",  label: "Withdraw", icon: ArrowDownCircle,bg: "bg-blue-100",   fg: "text-blue-600" },
    { href: "/rewards",   label: "Rewards",  icon: Trophy,         bg: "bg-pink-100",   fg: "text-pink-600" },
    { href: "/referrals", label: "Refer",    icon: Users,          bg: "bg-purple-100", fg: "text-purple-600" },
    { href: "/profile",   label: "Profile",  icon: User,           bg: "bg-sky-100",    fg: "text-sky-600" },
    { href: "/settings",  label: "Settings", icon: SettingsIcon,   bg: "bg-gray-100",   fg: "text-gray-600" },
  ];
  if (user?.role === "admin") quickLinks.push({ href: "/admin", label: "Admin", icon: Shield, bg: "bg-red-100", fg: "text-red-600" });

  const txTypeColor = (type: string) => {
    if (type === "survey_credit") return { bg: "bg-violet-100", fg: "text-violet-600", icon: BarChart3 };
    if (type === "referral_bonus") return { bg: "bg-purple-100", fg: "text-purple-600", icon: Users };
    if (type === "daily_checkin") return { bg: "bg-amber-100", fg: "text-amber-600", icon: Flame };
    if (type === "withdrawal_debit") return { bg: "bg-red-100", fg: "text-red-500", icon: ArrowDownCircle };
    return { bg: "bg-green-100", fg: "text-green-600", icon: TrendingUp };
  };

  return (
    <div className="min-h-screen bg-[#f0f2f8]">

      {/* ── TOP NAV ── */}
      <header className="bg-white border-b sticky top-0 z-50" style={{ boxShadow: "0 2px 8px rgba(79,53,210,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

         <Link href="/home-feed">
            <img src="/logo.webp" alt="SurveyEarn Pro" className="h-23 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-violet-600 hover:bg-violet-50 font-semibold text-xs px-3">
                  {l.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Daily goal mini bar */}
            <div className="hidden lg:flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-gray-400 font-medium">Daily Goal</span>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full xp-bar-fill rounded-full" style={{ width: `${goalPct}%` }} />
              </div>
              <span className="text-[10px] text-violet-600 font-bold">{goalPct}%</span>
            </div>

            {/* Balance pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 border font-bold text-sm" style={{ background: "linear-gradient(135deg,#fdf4ff,#ede9fe)", borderColor: "#c4b5fd", color: "#4f35d2" }}>
              <Coins className="w-3.5 h-3.5" />
              {isLoading ? "..." : toEP(balance)}
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 notification-dot" />
            </button>

            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-red-500 hidden sm:flex">
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile menu */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-1 animate-slide-in-down">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>
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

      {/* ── HERO BANNER ── */}
      <section style={{ background: "linear-gradient(135deg,#4f35d2 0%,#7c3aed 50%,#0891b2 100%)" }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* Left: greeting + streak */}
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Welcome back</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-1">
                Hi, {user?.name?.split(" ")[0] || "there"}! 👋
              </h1>
              <p className="text-white/70 text-sm mb-4">Here's what's waiting for you today.</p>

              {/* Streak badge */}
              {streak > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2">
                  <Flame className="w-4 h-4 text-amber-300 streak-fire" />
                  <span className="text-sm font-bold">{streak}-Day Streak!</span>
                  <span className="text-xs text-white/60">Keep it up</span>
                </div>
              )}
            </div>

            {/* Right: stats cards */}
            <div className="grid grid-cols-3 gap-3 animate-fade-in stagger-2">
              {[
                { label: "Balance",   value: isLoading ? "..." : toEP(balance),      sub: toDollars(balance),      icon: Coins,          color: "from-white/20 to-white/10" },
                { label: "Earned",    value: isLoading ? "..." : toEP(totalEarned),   sub: toDollars(totalEarned),  icon: TrendingUp,     color: "from-white/20 to-white/10" },
                { label: "Withdrawn", value: isLoading ? "..." : toDollars(wallet?.totalWithdrawnCents ?? 0), sub: "cash out", icon: ArrowUpCircle, color: "from-white/20 to-white/10" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} backdrop-blur-sm rounded-2xl p-3 md:p-4 text-center min-w-[90px] border border-white/10 animate-scale-in stagger-${i + 1}`}>
                    <Icon className="w-4 h-4 mx-auto mb-1.5 opacity-70" />
                    <p className="text-lg md:text-xl font-bold leading-none">{s.value}</p>
                    <p className="text-xs opacity-50 mt-1">{s.sub}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily goal bar */}
          <div className="mt-8 bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-sm font-bold">Daily Goal</span>
                <span className="text-xs text-white/50">{toDollars(todayEarned)} / {toDollars(dailyGoalCents)} earned today</span>
              </div>
              <span className="text-sm font-bold text-amber-300">{goalPct}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${goalPct}%`, background: "linear-gradient(90deg,#fbbf24,#f97316)" }} />
            </div>
            {goalPct >= 100 && (
              <p className="text-xs text-amber-300 mt-2 font-medium">🎉 Daily goal complete! Bonus EP earned!</p>
            )}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF TICKER ── */}
      <div className="bg-violet-700 text-white py-2 overflow-hidden">
        <div className="flex gap-8 social-ticker whitespace-nowrap text-xs font-medium">
          {[...TICKER_EVENTS, ...TICKER_EVENTS].map((e, i) => (
            <span key={i} className="flex items-center gap-1.5 opacity-90">
              <Zap className="w-3 h-3 text-amber-300 shrink-0" />
              <strong>{e.user}</strong> just {e.action}: <strong className="text-amber-300">{e.amount}</strong>
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* ── DAILY TASKS + CHECK-IN ROW ── */}
        <div className="grid md:grid-cols-5 gap-4">

          {/* Daily tasks */}
          <div className="md:col-span-3 bg-white rounded-2xl p-5 border border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-violet-600" />
                <h2 className="font-bold text-gray-800">Daily To-Do</h2>
              </div>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-3 py-1">
                {tasksDone}/{dailyTasks.length} done
              </span>
            </div>
            <div className="space-y-3">
              {dailyTasks.map((task, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${task.done ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    {task.done
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <Circle className="w-5 h-5 text-gray-300" />
                    }
                    <span className={`text-sm font-medium ${task.done ? "text-green-700 line-through opacity-60" : "text-gray-700"}`}>
                      {task.label}
                    </span>
                  </div>
                  <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${task.done ? "bg-green-100 text-green-600" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                    +{task.pts}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Check-in card */}
          <div className="md:col-span-2 rounded-2xl p-5 flex flex-col justify-between text-white" style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-base">Daily Check-in</p>
                {streak > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="w-3.5 h-3.5 text-white streak-fire" />
                    <span className="text-xs text-white/80">{streak}-day streak</span>
                  </div>
                )}
              </div>
            </div>

            {/* Streak dots */}
            <div className="flex gap-1.5 mb-4">
              {[1,2,3,4,5,6,7].map(day => (
                <div key={day} className={`flex-1 h-2 rounded-full ${day <= streak % 7 || (streak > 0 && streak % 7 === 0) ? "bg-white" : "bg-white/25"}`} />
              ))}
            </div>

            <div>
              <p className="text-xs text-white/70 mb-3">
                {checkinLoading ? "Loading..."
                  : checkin?.canCheckin
                  ? `Claim ${toEP(checkin.rewardCents)} now!`
                  : checkin?.nextCheckinAt
                  ? `Next at ${new Date(checkin.nextCheckinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </p>
              <Button
                className="w-full bg-white font-bold hover:bg-orange-50 transition-colors"
                style={{ color: "#f97316" }}
                disabled={checkinLoading || !checkin?.canCheckin || dailyCheckin.isPending}
                onClick={() => dailyCheckin.mutate()}
              >
                {dailyCheckin.isPending ? "Claiming..." : checkin?.canCheckin ? "🎁 Claim Bonus" : "✓ Claimed"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── FEATURED OFFERS GRID ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-lg font-bold text-gray-800">Featured Offers</h2>
            </div>
            <Link href="/surveys">
              <Button variant="ghost" size="sm" className="text-violet-600 gap-1 text-sm font-semibold">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {featuredOffers.map((offer) => {
              const Icon = offer.icon;
              return (
                <Link key={offer.title} href={offer.href}>
                  <div className={`earn-card h-40 flex flex-col justify-between p-4 text-white bg-gradient-to-br ${offer.gradient}`}>
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 offer-hot-badge ${offer.live ? "bg-green-400 text-green-900" : "bg-white/25 text-white"}`}>
                        {offer.badge}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{offer.title}</p>
                      <p className="text-[11px] text-white/65 mt-0.5">{offer.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── QUICK ACCESS ── */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Access</h2>
          <div className="grid grid-cols-4 md:grid-cols-9 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center transition-all group-hover:shadow-md group-hover:scale-105`}>
                      <Icon className={`w-6 h-6 ${item.fg}`} />
                    </div>
                    <span className="text-xs text-gray-500 font-semibold text-center leading-tight">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── CATEGORIZED OFFER ROWS ── */}
        {offerRows.map((row) => {
          const RowIcon = row.icon;
          return (
            <div key={row.title}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RowIcon className={`w-5 h-5 ${row.color}`} />
                  <h2 className="text-lg font-bold text-gray-800">{row.title}</h2>
                </div>
                <Link href={row.href}>
                  <Button variant="ghost" size="sm" className="text-violet-600 gap-1 text-sm font-semibold">
                    See all <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {row.items.map((item) => (
                  <Link key={item.name} href={row.href}>
                    <div className={`card-earn p-4 border ${item.color} cursor-pointer`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{item.time}</span>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">{item.ep}</span>
                      </div>
                      <p className="font-bold text-sm text-gray-800 mb-1">{item.name}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: "65%" }} />
                        </div>
                        <span className="text-[10px] text-gray-400">65% full</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── AD BANNER ── */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-white/80" />
            </div>
            <div>
              <p className="font-bold">Partner Ads & Sponsored Content</p>
              <p className="text-sm text-white/50">Live ads and partner offers will display here</p>
            </div>
          </div>
          <span className="text-xs text-white/30 border border-white/10 rounded-full px-3 py-1 shrink-0">Ad Space</span>
        </div>

        {/* ── RECENT ACTIVITY ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
            <Link href="/wallet">
              <Button variant="ghost" size="sm" className="text-violet-600 gap-1 text-sm font-semibold">
                See all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            {!history?.length ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No activity yet</p>
                <p className="text-xs mt-1 text-gray-300">Complete a survey to start earning!</p>
                <Link href="/surveys">
                  <Button className="mt-4 text-sm font-bold" style={{ background: "linear-gradient(135deg,#4f35d2,#7c3aed)", color: "white" }}>
                    Take a Survey
                  </Button>
                </Link>
              </div>
            ) : (
              <ul>
                {history.map((tx, i) => {
                  const { bg, fg, icon: TxIcon } = txTypeColor(tx.type);
                  return (
                    <li key={tx.id} className={`flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition-colors ${i !== history.length - 1 ? "border-b border-border/40" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <TxIcon className={`w-4 h-4 ${fg}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 capitalize">
                            {tx.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${tx.amountCents >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {tx.amountCents >= 0 ? "+" : ""}{toEP(Math.abs(tx.amountCents))}
                        </span>
                        <p className="text-[10px] text-gray-400">{toDollars(Math.abs(tx.amountCents))}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-10 border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400">
          <span>© 2026 SurveyEarn Pro. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-violet-600 no-underline">Privacy</a>
            <a href="#" className="hover:text-violet-600 no-underline">Terms</a>
            <a href="#" className="hover:text-violet-600 no-underline">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}