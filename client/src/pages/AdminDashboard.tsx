import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  BarChart3, Users, TrendingUp, Zap, Plus, CheckCircle,
  XCircle, LayoutDashboard, ClipboardList, LogOut, ShieldAlert,
  Eye, Ban, Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const adminNav = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: ClipboardList, label: "Surveys", path: "/admin/surveys" },
  { icon: Plus, label: "Create Survey", path: "/admin/surveys/new" },
  { icon: TrendingUp, label: "Withdrawals", path: "/admin/withdrawals" },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
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
      {/* Main content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function AdminOverview() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = trpc.admin.getAnalytics.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: withdrawals } = trpc.admin.getPendingWithdrawals.useQuery(
    { limit: 5 }, { enabled: user?.role === "admin" }
  );
  const approveWithdrawal = trpc.admin.approveWithdrawal.useMutation({ onSuccess: () => toast.success("Approved!") });
  const rejectWithdrawal = trpc.admin.rejectWithdrawal.useMutation({ onSuccess: () => toast.success("Rejected!") });

  const stats = [
    { label: "Total Users", value: analytics?.totalUsers ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Total Surveys", value: analytics?.totalSurveys ?? 0, icon: BarChart3, color: "text-accent" },
    { label: "Completions", value: analytics?.totalResponses ?? 0, icon: CheckCircle, color: "text-green-500" },
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
              <p className="text-4xl font-bold">{isLoading ? "-" : s.value.toLocaleString()}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/surveys/new">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-accent/30 hover:border-accent">
            <Plus className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-bold text-lg">Create Survey</h3>
            <p className="text-sm text-muted-foreground">Add a new survey for users</p>
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Users className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-bold text-lg">Manage Users</h3>
            <p className="text-sm text-muted-foreground">View, suspend or ban users</p>
          </Card>
        </Link>
        <Link href="/admin/surveys">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <ClipboardList className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-bold text-lg">Manage Surveys</h3>
            <p className="text-sm text-muted-foreground">Publish, edit or archive surveys</p>
          </Card>
        </Link>
      </div>

      {/* Pending withdrawals */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Pending Withdrawals</h2>
        {!withdrawals || withdrawals.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No pending withdrawals</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-semibold">Withdrawal #{w.id}</p>
                  <p className="text-sm text-muted-foreground">${w.amount} — {w.method.replace("_", " ")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveWithdrawal.mutate({ withdrawalId: w.id })} disabled={approveWithdrawal.isPending}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectWithdrawal.mutate({ withdrawalId: w.id, reason: "Rejected by admin" })} disabled={rejectWithdrawal.isPending}>
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

// ── Users ─────────────────────────────────────────────────────────────────────
function AdminUsers() {
  const { user } = useAuth();
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery(
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
        ) : !users || users.length === 0 ? (
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
                {users.map((u) => (
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

// ── Create Survey ─────────────────────────────────────────────────────────────
function AdminCreateSurvey() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsReward: 100,
    estimatedDurationMinutes: 5,
    category: "",
    quota: 100,
  });

  const createSurvey = trpc.admin.createSurvey.useMutation({
    onSuccess: () => {
      toast.success("Survey created! Go to Manage Surveys to publish it.");
      setForm({ title: "", description: "", pointsReward: 100, estimatedDurationMinutes: 5, category: "", quota: 100 });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Create Survey</h1>
      <p className="text-muted-foreground mb-8">Add a new survey for users to complete</p>

      <Card className="p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Survey Title *</label>
            <Input placeholder="e.g. Consumer Preferences 2026" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Brief description of the survey..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Points Reward *</label>
              <Input type="number" min={1} value={form.pointsReward} onChange={e => setForm(p => ({ ...p, pointsReward: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <Input type="number" min={1} value={form.estimatedDurationMinutes} onChange={e => setForm(p => ({ ...p, estimatedDurationMinutes: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Input placeholder="e.g. Technology, Health" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Response Quota</label>
              <Input type="number" min={1} value={form.quota} onChange={e => setForm(p => ({ ...p, quota: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!form.title || createSurvey.isPending}
            onClick={() => createSurvey.mutate({ title: form.title, description: form.description || undefined, pointsReward: form.pointsReward, estimatedDurationMinutes: form.estimatedDurationMinutes, category: form.category || undefined, quota: form.quota })}
          >
            {createSurvey.isPending ? "Creating..." : "Create Survey"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── Manage Surveys ────────────────────────────────────────────────────────────
function AdminSurveys() {
  const { user } = useAuth();
  const { data: surveys, isLoading, refetch } = trpc.survey.list.useQuery({ limit: 100, offset: 0 });
  const publishSurvey = trpc.admin.publishSurvey.useMutation({ onSuccess: () => { toast.success("Survey published!"); refetch(); } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Manage Surveys</h1>
      <p className="text-muted-foreground mb-8">Publish, review or archive surveys</p>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
        ) : !surveys || surveys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No surveys yet</p>
            <Link href="/admin/surveys/new"><Button><Plus className="w-4 h-4 mr-2" />Create First Survey</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{s.title}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{s.pointsReward} pts</span>
                    {s.estimatedDurationMinutes && <span>{s.estimatedDurationMinutes} min</span>}
                    {s.category && <span>{s.category}</span>}
                    <span>{s.completedCount} completions</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    s.status === "published" ? "bg-green-100 text-green-700" :
                    s.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {s.status}
                  </span>
                  {s.status === "draft" && (
                    <Button size="sm" onClick={() => publishSurvey.mutate({ surveyId: s.id })} disabled={publishSurvey.isPending}>
                      <Eye className="w-4 h-4 mr-1" /> Publish
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Withdrawals ───────────────────────────────────────────────────────────────
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
                  <p className="font-semibold">Withdrawal #{w.id}</p>
                  <p className="text-sm text-muted-foreground">${w.amount} ({w.pointsDeducted} points) — {w.method.replace("_", " ")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveWithdrawal.mutate({ withdrawalId: w.id })} disabled={approveWithdrawal.isPending}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectWithdrawal.mutate({ withdrawalId: w.id, reason: "Rejected by admin" })} disabled={rejectWithdrawal.isPending}>
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

// ── Main export ───────────────────────────────────────────────────────────────
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
    if (location === "/admin/surveys/new") return <AdminCreateSurvey />;
    if (location === "/admin/surveys") return <AdminSurveys />;
    if (location === "/admin/withdrawals") return <AdminWithdrawals />;
    return <AdminOverview />;
  };

  return <AdminLayout>{renderPage()}</AdminLayout>;
}
