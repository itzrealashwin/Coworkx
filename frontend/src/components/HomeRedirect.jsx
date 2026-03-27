import { Navigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useAuth } from "@/hooks/useAuth";

export default function HomeRedirect() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Let's rename 'data' to 'response' so it's less confusing
  const { data: response, isLoading } = useOrganizations();

  if (authLoading || isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (!response) return null;

  // Extract the actual array from your API response object!
  const orgsArray = response.organizations;

  // Now we safely check the length of the actual array
  if (orgsArray && orgsArray.length > 0) {
    console.log("Redirecting to:", orgsArray[0].slug);
    return <Navigate to={`/${orgsArray[0].slug}`} replace />;
  }
  
  console.log("User has 0 organizations");
  return <Navigate to="/orgs/new" replace />;
}