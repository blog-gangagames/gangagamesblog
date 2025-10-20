import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { getPublicSiteUrl } from "@/lib/siteConfig";

const AuthRedirector = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // On load, if already signed in, redirect to dashboard
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session;
      const emailConfirmed = Boolean(session?.user?.email_confirmed_at);
      if (mounted && session) {
        if (emailConfirmed) {
          navigate("/dashboard", { replace: true });
        } else {
          // Force logout if not confirmed, then send user home
          supabase.auth.signOut().finally(() => {
            try { window.location.href = getPublicSiteUrl(); }
            catch { navigate("/", { replace: true }); }
          });
        }
      }
    });

    // Listen for auth state changes to handle sign-in/sign-up
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const emailConfirmed = Boolean(session?.user?.email_confirmed_at);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        if (emailConfirmed) {
          navigate("/dashboard", { replace: true });
        } else {
          supabase.auth.signOut().finally(() => {
            try { window.location.href = getPublicSiteUrl(); }
            catch { navigate("/", { replace: true }); }
          });
        }
      } else if (event === "SIGNED_OUT") {
        try { window.location.href = getPublicSiteUrl(); }
        catch { navigate("/", { replace: true }); }
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  return null;
};

export default AuthRedirector;