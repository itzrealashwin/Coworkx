import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";

const RESEND_COOLDOWN_SECONDS = 30;

function Field({ label, id, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-[12px] text-muted-foreground font-medium mt-1">
          {hint}
        </p>
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

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    verifyOtpAsync,
    isVerifyingOtp,
    verifyOtpError,
    resendOtpAsync,
    isResendingOtp,
    resendOtpError,
  } = useAuth();

  const emailFromState = location.state?.email || "";
  const from = location.state?.from;

  const [email, setEmail] = useState(emailFromState);
  const [isEmailEditable, setIsEmailEditable] = useState(!emailFromState);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    setResendMessage("");
  }, [email]);

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!otp) {
      newErrors.otp = "OTP is required";
    } else if (otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      await verifyOtpAsync({ email, otp });
      setIsVerified(true);
    } catch (_) {
      setIsVerified(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }

    try {
      const response = await resendOtpAsync({ email });
      setResendMessage(response?.message || "A new verification code has been sent.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (_) {
      setResendMessage("");
    }
  };

  return (
    <>
      <Card className="px-2 py-4 sm:px-4">
        <CardHeader className="text-center space-y-2 mb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Verify your email
          </CardTitle>
          <CardDescription className="font-medium text-sm">
            Enter the 6-digit code sent to your inbox
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email address" id="email" error={errors.email}>
              <div className="space-y-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={!isEmailEditable || isVerifyingOtp || isResendingOtp}
                  className={`h-10 text-sm font-medium transition-all duration-150 ${
                    errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""
                  }`}
                />
                {!isEmailEditable && emailFromState && (
                  <button
                    type="button"
                    onClick={() => setIsEmailEditable(true)}
                    className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Use a different email
                  </button>
                )}
              </div>
            </Field>

            <Field label="Verification code" id="otp" error={errors.otp} hint="Code is valid for 5 minutes">
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                disabled={isVerifyingOtp}
                className={`h-10 text-center tracking-[0.3em] text-sm font-semibold transition-all duration-150 ${
                  errors.otp ? "border-destructive focus-visible:ring-destructive/20" : ""
                }`}
              />
            </Field>

            {verifyOtpError && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 rounded-md px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-destructive">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                  <path d="M6 3.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="6" cy="8.5" r="0.75" fill="currentColor" />
                </svg>
                <p className="text-[13px] text-destructive font-medium">
                  {verifyOtpError?.response?.data?.message ?? "Verification failed. Please try again."}
                </p>
              </div>
            )}

            {isVerified && (
              <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-emerald-600">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                  <path d="M3.8 6.2L5.2 7.6L8.3 4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[13px] text-emerald-700 font-medium">
                  Email verified. You can log in now.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full h-10 mt-2 text-sm font-bold shadow-sm transition-colors duration-150"
            >
              {isVerifyingOtp ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify email"
              )}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResendingOtp || resendCooldown > 0}
                className="font-semibold text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResendingOtp
                    ? "Sending code..."
                    : "Resend code"}
              </button>
              {resendMessage && (
                <span className="text-emerald-600 font-semibold">
                  {resendMessage}
                </span>
              )}
            </div>

            {resendOtpError && (
              <p className="text-[12px] text-destructive font-medium">
                {resendOtpError?.response?.data?.message ?? "Unable to resend OTP. Try again shortly."}
              </p>
            )}

            {isVerified && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 text-sm font-semibold"
                onClick={() => navigate("/login", { state: { from } })}
              >
                Continue to login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-[13px] text-muted-foreground mt-6 font-medium">
        Remembered your password?{" "}
        <Link
          to="/login"
          state={{ from }}
          className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
