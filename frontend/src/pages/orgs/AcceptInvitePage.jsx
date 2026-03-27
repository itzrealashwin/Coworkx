import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptInvitation } from "@/hooks/useInvitations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys.js";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [status, setStatus] = useState("loading"); // loading, success, error, unauthenticated
  const [errorMsg, setErrorMsg] = useState("");
  const [acceptedOrgSlug, setAcceptedOrgSlug] = useState("");
  
  const acceptMutation = useAcceptInvitation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Wait until auth state is known
    if (authLoading) return;

    if (!isAuthenticated) {
      // Need login first. We save this path to maybe come back to it.
      setStatus("unauthenticated");
      return;
    }

    const processInvite = async () => {
      setStatus("loading");
      try {
        const response = await acceptMutation.mutateAsync(token);
        // Invalidate organizations so the new one appears in the lists
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list });
        
        // Use response data to find the org slug to redirect to if available
        // Fallback to home if not in response
        const newOrgSlug = response?.organization?.slug || response?.org?.slug;
        
        if (newOrgSlug) {
          setAcceptedOrgSlug(newOrgSlug);
        }
        
        setStatus("success");
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Failed to accept the invitation. It may be invalid or expired.");
        setStatus("error");
      }
    };

    processInvite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, authLoading]);

  const handleLoginRedirect = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  const handleRegisterRedirect = () => {
    navigate("/register", { state: { from: location.pathname } });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        {status === "loading" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Processing Invitation</CardTitle>
              <CardDescription>Please wait while we confirm your invite...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </CardContent>
          </>
        )}

        {status === "unauthenticated" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Authentication Required</CardTitle>
              <CardDescription>
                You must be logged in to accept this invitation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 py-4">
              <Button onClick={handleLoginRedirect} className="w-full">
                Log In
              </Button>
              <div className="relative border-t text-center text-sm my-2">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  New to Coworkx?
                </span>
              </div>
              <Button variant="outline" onClick={handleRegisterRedirect} className="w-full">
                Create an Account
              </Button>
            </CardContent>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Invitation Accepted!</CardTitle>
              <CardDescription>
                You have successfully joined the organization.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-2 pb-6">
              <Button onClick={() => navigate(acceptedOrgSlug ? `/${acceptedOrgSlug}` : "/")} className="w-full">
                Go to Dashboard
              </Button>
            </CardFooter>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
              <CardDescription className="text-destructive">
                {errorMsg}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-2 pb-6">
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Return Home
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
