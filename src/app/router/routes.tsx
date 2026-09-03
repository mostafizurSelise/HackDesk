import { useEffect, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { RedirectIfAuthenticated, RequireAuth } from "./guards";
import { CallbackPage } from "../../features/auth/CallbackPage";
import { ErrorPage } from "../../features/auth/ErrorPage";
import { LoginPage } from "../../features/auth/LoginPage";
import { NotFoundPage } from "../../features/auth/NotFoundPage";
import { ProfilePage } from "../../features/profile/ProfilePage";
import { ActivatePage } from "../../features/registration/ActivatePage";
import { MyRegistrationPage } from "../../features/registration/MyRegistrationPage";
import { OrganizerConsolePage } from "../../features/registration/OrganizerConsolePage";
import { RegisterPage } from "../../features/registration/RegisterPage";

const protectedRoutes = {
  "/": ProfilePage,
  "/error": ErrorPage,
  "/my-registration": MyRegistrationPage,
  "/organizer": OrganizerConsolePage
};

export function AppRouter() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextPath: string) {
    const [nextPathname = "/", queryString = ""] = nextPath.split("?");
    window.history.pushState({}, "", nextPath);
    setPath(nextPathname);
    setSearch(queryString ? `?${queryString}` : "");
  }

  if (path === "/login/callback") {
    return <CallbackPage onNavigate={navigate} />;
  }

  if (path === "/login") {
    const returnTo = new URLSearchParams(search).get("returnTo") || undefined;
    return (
      <RedirectIfAuthenticated onNavigate={navigate}>
        <LoginPage onNavigate={navigate} returnTo={returnTo} />
      </RedirectIfAuthenticated>
    );
  }

  if (path === "/register") {
    return (
      <RedirectIfAuthenticated onNavigate={navigate}>
        <RegisterPage onNavigate={navigate} />
      </RedirectIfAuthenticated>
    );
  }

  if (path === "/activate") {
    const code = new URLSearchParams(search).get("code") || undefined;
    return (
      <RedirectIfAuthenticated onNavigate={navigate}>
        <ActivatePage code={code} onNavigate={navigate} />
      </RedirectIfAuthenticated>
    );
  }

  const Page = protectedRoutes[path as keyof typeof protectedRoutes];
  if (!Page) {
    return <NotFoundPage onNavigate={navigate} />;
  }

  return (
    <RequireAuth currentPath={path} onNavigate={navigate}>
      <AppShell activePath={path} onNavigate={navigate}>
        <Page />
      </AppShell>
    </RequireAuth>
  );
}
