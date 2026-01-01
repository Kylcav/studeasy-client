import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import { getProfileImageObjectUrl } from "../api/users";

const linkStyle = ({ isActive }: any) => ({
  padding: "10px 14px",
  borderRadius: 8,
  background: isActive ? "#e8ebff" : "transparent",
  color: "#1a1a1a",
  textDecoration: "none",
});

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const role = String(user?.role ?? user?.type ?? "").trim().toLowerCase();
  const isTeacher = role === "teacher";
  const base = isTeacher ? "/teacher" : "/student";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ✅ Charger l'avatar depuis le backend (utile si image privée / nécessite Authorization)
  useEffect(() => {
    let mounted = true;
    let lastUrl: string | null = null;

    (async () => {
      const id = String(user?.id ?? user?._id ?? "");
      if (!id) {
        if (mounted) setAvatarUrl(null);
        return;
      }

      const url = await getProfileImageObjectUrl(id);

      if (!mounted) return;

      // cleanup old object url
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = url;

      setAvatarUrl(url);
    })();

    return () => {
      mounted = false;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
    };
  }, [user?.id, user?._id]);

  const onLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <aside style={{ width: 240, background: "#fff", padding: 24 }}>
      {/* ✅ Header compte (avatar + email) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(0,0,0,0.06)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 18 }}>👤</span>
          )}
        </div>

        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.5 }}>STUDEASY</div>
          <div
            style={{
              fontSize: 12,
              color: "var(--placeholder)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 150,
            }}
            title={user?.email ?? ""}
          >
            {user?.email ?? ""}
          </div>
        </div>
      </div>

      <nav style={{ display: "grid", gap: 8 }}>
        <NavLink to={base} style={linkStyle}>
          Dashboard
        </NavLink>

        {!isTeacher && (
          <NavLink to={`${base}/subjects`} style={linkStyle}>
            Cours
          </NavLink>
        )}

        <NavLink to={`${base}/classes`} style={linkStyle}>
          Classes
        </NavLink>

        {isTeacher ? (
          <NavLink to={`${base}/insights`} style={linkStyle}>
            Insights
          </NavLink>
        ) : (
          <NavLink to={`${base}/errors`} style={linkStyle}>
            Erreurs
          </NavLink>
        )}

        <NavLink to={`${base}/profile`} style={linkStyle}>
          Profile
        </NavLink>

        <button
          onClick={onLogout}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e6e6e6",
            background: "transparent",
            textAlign: "left",
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Déconnexion
        </button>
      </nav>
    </aside>
  );
}
