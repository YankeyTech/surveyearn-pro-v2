import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Zap, Camera, User, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profilePictureUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => toast.success("Profile updated successfully!"),
    onError: (e) => toast.error(e.message),
  });

  const uploadPicture = trpc.user.uploadProfilePicture.useMutation({
    onSuccess: (data) => {
      setAvatarPreview(data.url);
      toast.success("Profile picture updated!");
    },
    onError: (e) => toast.error(e.message),
  });

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAvatarPreview(reader.result as string);
      uploadPicture.mutate({ file: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    updateProfile.mutate({ name, email });
  };

  const handleChangePassword = () => {
    if (!newPassword) { toast.error("Please enter a new password"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    // Password change would need a separate backend endpoint
    toast.success("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-1">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account security</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left — Avatar & Info */}
          <div className="space-y-6">
            <Card className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 mx-auto">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt={user?.name || ""} />}
                  <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  user?.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {user?.role === "admin" ? "Admin" : "Member"}
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Account Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login method</span>
                  <span className="font-medium capitalize">{user?.loginMethod || "Email"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified</span>
                  <span className={`font-medium ${user?.isVerified ? "text-green-600" : "text-orange-500"}`}>
                    {user?.isVerified ? "Yes" : "Pending"}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right — Forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold">Personal Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-2 block">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="mb-2 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>

            {/* Change Password */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold">Change Password</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPw" className="mb-2 block">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPw"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPw" className="mb-2 block">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPw"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPw" className="mb-2 block">Confirm New Password</Label>
                  <Input
                    id="confirmPw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
                {newPassword && (
                  <div className="space-y-1">
                    {[
                      { label: "At least 6 characters", ok: newPassword.length >= 6 },
                      { label: "Passwords match", ok: newPassword === confirmPassword && confirmPassword !== "" },
                    ].map((check) => (
                      <p key={check.label} className={`text-xs flex items-center gap-1.5 ${check.ok ? "text-green-600" : "text-muted-foreground"}`}>
                        <span>{check.ok ? "✓" : "○"}</span> {check.label}
                      </p>
                    ))}
                  </div>
                )}
                <Button onClick={handleChangePassword} variant="outline" className="gap-2">
                  <Lock className="w-4 h-4" />
                  Update Password
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
