import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back!");
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (error) => toast.error(error.message),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created!");
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (error) => toast.error(error.message),
  });

  const forgotPassword = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      toast.success("If that email exists, a reset link has been sent!");
      setMode("login");
    },
    onError: (error) => toast.error(error.message),
  });

  const isLoading = login.isPending || register.isPending || forgotPassword.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!email) { toast.error("Please enter your email"); return; }
      forgotPassword.mutate({ email });
      return;
    }

    if (!email || !password) { toast.error("Please fill in all fields"); return; }

    if (mode === "register") {
      if (!name) { toast.error("Please enter your name"); return; }
      if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
      register.mutate({ name, email, password });
    } else {
      login.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to continue earning rewards"
              : mode === "register"
              ? "Sign up to start earning rewards"
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-xs text-accent underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : mode === "register"
                ? "Create account"
                : "Send reset link"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button type="button" className="text-accent underline" onClick={() => setMode("register")}>
                  Sign up
                </button>
              </>
            ) : mode === "register" ? (
              <>
                Already have an account?{" "}
                <button type="button" className="text-accent underline" onClick={() => setMode("login")}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                Remember it?{" "}
                <button type="button" className="text-accent underline" onClick={() => setMode("login")}>
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}