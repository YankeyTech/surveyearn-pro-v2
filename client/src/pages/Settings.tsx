import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, Bell, Shield, Moon, Sun, Globe, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    surveyAvailable: true,
    rewardApproved: true,
    referralBonus: true,
    withdrawalStatus: true,
    newsletter: false,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    shareStats: false,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preference saved");
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Privacy setting saved");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin"><Zap className="w-8 h-8 text-accent" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <Link href="/"><Button>Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account settings</p>
        </div>
      </div>

      <div className="container py-8 max-w-2xl space-y-6">

        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sun className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold">Appearance</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred theme</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Globe },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => { setTheme(option.value as any); toast.success(`Theme set to ${option.label}`); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === option.value
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${theme === option.value ? "text-accent" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${theme === option.value ? "text-accent" : ""}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          <div className="space-y-5">
            {[
              { key: "surveyAvailable", label: "New surveys available", desc: "Get notified when new surveys match your profile" },
              { key: "rewardApproved", label: "Reward approved", desc: "When your reward redemption is processed" },
              { key: "referralBonus", label: "Referral bonus earned", desc: "When someone you referred completes a survey" },
              { key: "withdrawalStatus", label: "Withdrawal updates", desc: "Status changes on your withdrawal requests" },
              { key: "newsletter", label: "Newsletter & tips", desc: "Weekly tips to maximize your earnings" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="font-medium">{item.label}</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold">Privacy</h2>
          </div>
          <div className="space-y-5">
            {[
              { key: "showProfile", label: "Public profile", desc: "Allow other users to see your profile" },
              { key: "shareStats", label: "Share earning stats", desc: "Show your earnings on the leaderboard" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="font-medium">{item.label}</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={privacy[item.key as keyof typeof privacy]}
                  onCheckedChange={() => handlePrivacyChange(item.key as keyof typeof privacy)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="font-medium text-red-900">Sign out of all devices</p>
                <p className="text-sm text-red-700 mt-0.5">This will log you out everywhere</p>
              </div>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={logout}>
                Sign Out
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="font-medium text-red-900">Delete account</p>
                <p className="text-sm text-red-700 mt-0.5">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => toast.error("Please contact support to delete your account")}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
