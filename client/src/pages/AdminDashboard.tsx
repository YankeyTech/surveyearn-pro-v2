import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BarChart3, Users, TrendingUp, Zap, Plus, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getAnalytics.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );
  const { data: withdrawals, isLoading: withdrawalsLoading } =
    trpc.admin.getPendingWithdrawals.useQuery(
      { limit: 10 },
      { enabled: user?.role === "admin" }
    );

  const approveWithdrawal = trpc.admin.approveWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal approved!");
    },
  });

  const rejectWithdrawal = trpc.admin.rejectWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal rejected!");
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

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage surveys, users, and platform analytics</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Analytics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Total Users</h3>
              <Users className="w-5 h-5 text-accent" />
            </div>
            <p className="text-4xl font-bold">
              {analyticsLoading ? "-" : analytics?.totalUsers || 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Total Surveys</h3>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold">
              {analyticsLoading ? "-" : analytics?.totalSurveys || 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Completed Surveys</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold">
              {analyticsLoading ? "-" : analytics?.completedSurveys || 0}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground">Points Distributed</h3>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-4xl font-bold">
              {analyticsLoading ? "-" : (analytics?.totalPointsDistributed || 0).toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/admin/surveys/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Survey
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/surveys">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Manage Surveys
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Pending Withdrawals</h2>

          {withdrawalsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : withdrawals && withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">Withdrawal #{withdrawal.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ${withdrawal.amount} ({withdrawal.pointsDeducted} points)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Method: {withdrawal.method.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        approveWithdrawal.mutate({ withdrawalId: withdrawal.id })
                      }
                      disabled={approveWithdrawal.isPending}
                      className="gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        rejectWithdrawal.mutate({
                          withdrawalId: withdrawal.id,
                          reason: "Manual review required",
                        })
                      }
                      disabled={rejectWithdrawal.isPending}
                      className="gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending withdrawals</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
