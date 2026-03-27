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

// ─── FIELD WRAPPER ────────────────────────────────────────────────
function Field({ label, id, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-[12px] text-muted-foreground font-medium mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-[12px] text-destructive font-medium flex items-center gap-1.5 mt-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-destructive">
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

// ─── PASSWORD STRENGTH ────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const levels = [
    { label: "Too weak",  color: "bg-destructive", textColor: "text-destructive" },
    { label: "Weak",      color: "bg-destructive", textColor: "text-destructive" },
    { label: "Fair",      color: "bg-yellow-500", textColor: "text-yellow-500" },
    { label: "Good",      color: "bg-green-500", textColor: "text-green-500" },
    { label: "Strong",    color: "bg-green-500", textColor: "text-green-500" },
  ];
  // To avoid crash if score goes over array bounds (though max is 4)
  const level = levels[Math.min(score, 4)];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score - 1 ? level.color : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${level.textColor}`}>
        {level.label}
      </p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerAsync, isRegistering, registerError } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await registerAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      // Pass 'from' state to keep redirect path active
      const from = location.state?.from;
      navigate("/verify-otp", { state: { email: formData.email, from } });
    } catch (_) {}
  };

  return (
    <>
      <Card className="px-2 py-4 sm:px-4">
        <CardHeader className="text-center space-y-2 mb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your account
          </CardTitle>
          <CardDescription className="font-medium text-sm">
            Join CoWorkx and start shipping faster
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* GitHub OAuth — Primary */}
          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center gap-3 mb-5 border-border shadow-sm text-sm h-10 font-semibold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign up with GitHub
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full Name */}
            <Field label="Full name" id="name" error={errors.name}>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ashwin Mali"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isRegistering}
                className={`h-10 text-sm font-medium transition-all duration-150 ${
                  errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
              />
            </Field>

            {/* Email */}
            <Field label="Email address" id="email" error={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isRegistering}
                className={`h-10 text-sm font-medium transition-all duration-150 ${
                  errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
              />
            </Field>

            {/* Password */}
            <Field
              label="Password"
              id="password"
              error={errors.password}
              hint="Must be at least 8 characters"
            >
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isRegistering}
                className={`h-10 text-sm font-medium transition-all duration-150 ${
                  errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
              />
              <PasswordStrength password={formData.password} />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm password" id="confirmPassword" error={errors.confirmPassword}>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isRegistering}
                  className={`h-10 text-sm font-medium transition-all duration-150 ${
                      errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/20" : ""
                    } ${
                      formData.confirmPassword &&
                      formData.password === formData.confirmPassword
                        ? "border-green-500 focus-visible:ring-green-500/20"
                        : ""
                    }
                  `}
                />
                {/* Match checkmark */}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="#22c55e" />
                        <path
                          d="M4.5 8L7 10.5L11.5 5.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
              </div>
            </Field>

            {/* Server error */}
            {registerError && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 rounded-md px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-destructive">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                  <path d="M6 3.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="6" cy="8.5" r="0.75" fill="currentColor" />
                </svg>
                <p className="text-[13px] text-destructive font-medium">
                  {registerError?.response?.data?.message ??
                    "Registration failed. Please try again."}
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isRegistering}
              className="w-full h-10 mt-2 text-sm font-bold shadow-sm transition-colors duration-150"
            >
              {isRegistering ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            {/* Terms note */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-1">
              By creating an account you agree to our{" "}
              <Link to="#" className="text-primary hover:text-primary/80 hover:underline font-semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="#" className="text-primary hover:text-primary/80 hover:underline font-semibold">
                Privacy Policy
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Login link — outside card */}
      <p className="text-center text-[13px] text-muted-foreground mt-6 font-medium">
        Already have an account?{" "}
        <Link
          to="/login"
          state={location.state}
          className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
