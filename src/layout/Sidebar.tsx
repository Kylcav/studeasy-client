import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfileImageObjectUrl } from "../api/users";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = String(user?.role ?? user?.type ?? "").trim().toLowerCase();
  const isTeacher = role === "teacher";
  const base = isTeacher ? "/teacher" : "/student";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let lastUrl: string | null = null;

    (async () => {
      try {
        const id = String(user?.id ?? user?._id ?? "");
        if (!id) {
          if (mounted) setAvatarUrl(null);
          return;
        }

        const url = await getProfileImageObjectUrl(id);
        if (!mounted) return;

        if (lastUrl) URL.revokeObjectURL(lastUrl);
        lastUrl = url;

        setAvatarUrl(url);
      } catch {
        if (mounted) setAvatarUrl(null);
      }
    })();

    return () => {
      mounted = false;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
    };
  }, [user?.id, user?._id]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <aside className="sidebar">
      {/* Sidebar pro : uniquement avatar + navigation */}
      <button
        type="button"
        className="sidebar-profile sidebar-profile--minimal"
        onClick={() => navigate(`${base}/profile`)}
        aria-label="Ouvrir mon profil"
      >
        <div className="sidebar-avatar">
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
      </button>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {isTeacher ? (
          <>
            <NavLink to={`${base}/home`} className={navClass}>
              Accueil
            </NavLink>
            <NavLink to={`${base}/classes`} className={navClass}>
              Classes
            </NavLink>
            <NavLink to={`${base}/insights`} className={navClass}>
              Insights
            </NavLink>
            <NavLink to={`${base}/profile`} className={navClass}>
              Profil
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to={`${base}/home`} className={navClass}>
              Accueil
            </NavLink>
            <NavLink to={`${base}/classes`} className={navClass}>
              Classes
            </NavLink>
            <NavLink to={`${base}/rank`} className={navClass}>
              Rang / Erreurs
            </NavLink>
            <NavLink to={`${base}/profile`} className={navClass}>
              Profil
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
