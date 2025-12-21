import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type AuthUser = { userId: string; username: string } | null;

type AuthContextValue = {
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser>>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("taskmentor-user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let ignore = false;
    async function verifyUser() {
      if (!user) return;
      try {
        const res = await fetch(`/api/users/${user.userId}`);
        if (!res.ok) {
          throw new Error("user not valid");
        }
      } catch {
        localStorage.removeItem("taskmentor-user");
        if (!ignore) setUser(null);
      }
    }
    verifyUser();
    return () => {
      ignore = true;
    };
  }, [user]);

  const logout = () => {
    localStorage.removeItem("taskmentor-user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, setUser, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
