"use client";

export default function LogoutButton() {
  function logout() {
    // Send wrong credentials to replace browser's cached Basic Auth for this realm
    fetch("/admin", {
      headers: { Authorization: "Basic " + btoa("logout:logout") },
      cache: "no-store",
    }).finally(() => {
      window.location.replace("/");
    });
  }

  return (
    <button
      onClick={logout}
      style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "rgba(241,236,225,0.4)", border: "1px solid rgba(241,236,225,0.15)", borderRadius: 100, padding: "7px 16px", cursor: "pointer", transition: "color 0.3s, border-color 0.3s" }}
    >
      Log out
    </button>
  );
}
