import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Pre-render auth gate: redirect to admin-hosted /signin.html if not signed-in
try {
  const signedIn = typeof localStorage !== 'undefined' && localStorage.getItem('GG_AUTH_OK') === '1';
  if (!signedIn && typeof location !== 'undefined') {
    location.href = "/signin.html";
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
