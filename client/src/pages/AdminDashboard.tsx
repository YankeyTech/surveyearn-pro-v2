import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  BarChart3, Users, TrendingUp, Zap, CheckCircle,
  XCircle, LayoutDashboard, LogOut, ShieldAlert, Ban, Clock
} from "lucide-react";
import { toast } from "sonner";

const adminNav = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: TrendingUp, label: "Withdrawals", path: "/admin/withdrawals" },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-accent" />
            <div>
              <p className="font-bold text-sm">Admin Panel</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
                }`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full">View Site</Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full gap-2 text-red-500 hover:text-red-600" onClick={logout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

function AdminOverview() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = trpc.admin.getAnalytics.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: withdrawals, refetch } = trpc.admin.getPendingWithdrawals.useQuery(
    { limit: 5 }, { enabled: user?.role === "admin" }
  );
  const approveWithdrawal = trpc.admin.approveWithdrawal.useMutation({ onSuccess: () => { toast.success("Approved!"); refetch(); } });
  const rejectWithdrawal = trpc.admin.rejectWithdrawal.useMutation({ onSuccess: () => { toast.success("Rejected!"); refetch(); } });

  const stats = [
    { label: "Total Users", value: analytics?.totalUsers ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Survey Completions", value: analytics?.totalResponses ?? 0, icon: BarChart3, color: "text-accent" },
    { label: "Total Earned", value: `$${((analytics?.totalEarnedCents ?? 0) / 100).toFixed(2)}`, icon: TrendingUp, color: "text-green-500" },
    { label: "Pending Withdrawals", value: analytics?.pendingWithdrawals ?? 0, icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Overview</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user?.name || "Admin"}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-4xl font-bold">{isLoading ? "-" : s.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Pending Withdrawals</h2>
        {!withdrawals || withdrawals.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No pending withdrawals</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-semibold">{w.userName || "Unknown"} — Withdrawal #{w.id}</p>
                  <p className="text-sm text-muted-foreground">
                    ${(w.amountCents / 100).toFixed(2)} — {w.method.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{w.userEmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveWithdrawal.mutate({ withdrawalId: w.id })} disabled={approveWithdrawal.isPending}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectWithdrawal.mutate({ withdrawalId: w.id })} disabled={rejectWithdrawal.isPending}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminUsers() {
  const { user } = useAuth();
  const { data: userList, isLoading, refetch } = trpc.admin.listUsers.useQuery(
    { limit: 100, offset: 0 }, { enabled: user?.role === "admin" }
  );
  const suspendUser = trpc.admin.suspendUser.useMutation({ onSuccess: () => { toast.success("User suspended"); refetch(); } });
  const banUser = trpc.admin.banUser.useMutation({ onSuccess: () => { toast.success("User banned"); refetch(); } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-8">All registered users on SurveyEarn Pro</p>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}
          </div>
        ) : !userList || userList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-semibold text-muted-foreground">User</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Role</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Status</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Joined</th>
                  <th className="pb-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userList.map((u) => (
                  <tr key={u.id} className="py-3">
                    <td className="py-3">
                      <p className="font-medium">{u.name || "No name"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === "admin" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.isBanned ? "bg-red-100 text-red-700" :
                        u.isSuspended ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {u.isBanned ? "Banned" : u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3">
                      {u.role !== "admin" && (
                        <div className="flex gap-2">
                          {!u.isSuspended && !u.isBanned && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => suspendUser.mutate({ userId: u.id })}>
                              Suspend
                            </Button>
                          )}
                          {!u.isBanned && (
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => banUser.mutate({ userId: u.id })}>
                              <Ban className="w-3 h-3 mr-1" /> Ban
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminWithdrawals() {
  const { user } = useAuth();
  const { data: withdrawals, isLoading, refetch } = trpc.admin.getPendingWithdrawals.useQuery(
    { limit: 50 }, { enabled: user?.role === "admin" }
  );
  const approveWithdrawal = trpc.admin.approveWithdrawal.useMutation({ onSuccess: () => { toast.success("Approved!"); refetch(); } });
  const rejectWithdrawal = trpc.admin.rejectWithdrawal.useMutation({ onSuccess: () => { toast.success("Rejected!"); refetch(); } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Withdrawals</h1>
      <p className="text-muted-foreground mb-8">Approve or reject pending withdrawal requests</p>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
        ) : !withdrawals || withdrawals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-semibold">{w.userName || "Unknown"} — Withdrawal #{w.id}</p>
                  <p className="text-sm text-muted-foreground">
                    ${(w.amountCents / 100).toFixed(2)} — {w.method.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{w.userEmail} — {w.accountDetails}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveWithdrawal.mutate({ withdrawalId: w.id })} disabled={approveWithdrawal.isPending}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectWithdrawal.mutate({ withdrawalId: w.id })} disabled={rejectWithdrawal.isPending}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin"><Zap className="w-8 h-8 text-accent" /></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  const renderPage = () => {
    if (location === "/admin/users") return <AdminUsers />;
    if (location === "/admin/withdrawals") return <AdminWithdrawals />;
    return <AdminOverview />;
  };

  return <AdminLayout>{renderPage()}</AdminLayout>;
}