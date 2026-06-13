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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

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

          {mode !== "forgot" && (
            <div className="mb-4">
              <a href="/api/auth/google" className="flex items-center justify-center gap-3 w-full border border-input rounded-md px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
                <GoogleIcon />
                Continue with Google
              </a>
            </div>
          )}

          {mode !== "forgot" && (
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>
          )}

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