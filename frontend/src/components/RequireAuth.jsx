import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";

export default function RequireAuth() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();

  const {
    data: organizations,
    isLoading: isOrgsLoading,
    isFetching: isOrgsFetching,
  } = useOrganizations({
    enabled: !!user,  // ← only fires when user is confirmed
  });

  const isOrgsSettled = !isOrgsLoading && !isOrgsFetching;

  if (isAuthLoading || (user && !isOrgsSettled)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user.isVerified) return <Navigate to="/verify-otp" replace />;

  if (
    isOrgsSettled &&
    organizations?.length === 0 &&
    !location.pathname.startsWith("/orgs/new")
  ) {
    return <Navigate to="/orgs/new" replace />;
  }

  return <Outlet />;
}