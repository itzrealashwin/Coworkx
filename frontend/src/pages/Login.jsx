import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Reusable field wrapper
function Field({ label, id, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[13px] font-semibold text-foreground"
      >
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[12px] text-destructive font-medium flex items-center gap-1.5 mt-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
            <path d="M6 3.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.75" fill="currentColor" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsync, isLoggingIn, loginError } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await loginAsync({ email: formData.email, password: formData.password });
      
      // Navigate to the referring page if it exists (like an invitation link), otherwise go to "/"
      const from = location.state?.from || "/";
      navigate(from, { replace: true });
    } catch (error) {
      if (error?.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-otp", {
          state: { email: formData.email, from: location.state?.from },
        });
      }
    }
  };

  return (
    <>
      <Card className="px-2 py-4 sm:px-4">
        <CardHeader className="text-center space-y-2 mb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Log in to CoWorkx
          </CardTitle>
          <CardDescription className="font-medium text-sm">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* GitHub OAuth — Primary action */}
          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center gap-3 mb-5 border-border shadow-sm text-sm h-10 font-semibold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email address" id="email" error={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoggingIn}
                className={`h-10 text-sm font-medium transition-all duration-150 ${
                  errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
              />
            </Field>

            <Field label="Password" id="password" error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoggingIn}
                  className={`h-10 text-sm font-medium transition-all duration-150 ${
                    errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""
                  }`}
                />
              </div>
              {/* Forgot password */}
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </Field>

            {/* Server error */}
            {loginError && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 rounded-md px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-destructive">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                  <path d="M6 3.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="6" cy="8.5" r="0.75" fill="currentColor" />
                </svg>
                <p className="text-[13px] text-destructive font-medium">
                  {loginError?.response?.data?.message ?? "Login failed. Please try again."}
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-10 mt-2 text-sm font-bold shadow-sm transition-colors duration-150"
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sign up link — outside card */}
      <p className="text-center text-[13px] text-muted-foreground mt-6 font-medium">
        Don't have an account?{" "}
        <Link
          to="/register"
          state={location.state}
          className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors"
        >
          Sign up for free
        </Link>
      </p>
    </>
  );
}