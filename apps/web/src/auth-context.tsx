import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { personas } from "@relay/demo-seed";

const accountStorageKey = "relay.accounts.v1";
const sessionStorageKey = "relay.active-account.v1";
const seededPasswordHash = "f18e3f4c3bac9fbbac73f3d831b25daf2702d150a09553a01722eccafc7e5558";

type StoredAccount = {
  id: string;
  hcpId: string;
  email: string;
  mobile: string;
  passwordHash: string;
};

type PublicAccount = Omit<StoredAccount, "passwordHash">;
type AuthResult = { ok: true } | { ok: false; error: string };
type SignUpInput = { npi: string; mobile: string; email: string; password: string };

type AccountAuthValue = {
  account?: PublicAccount;
  hcpId?: string;
  isAuthenticated: boolean;
  getAccountEmail: (hcpId: string) => string | undefined;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  logout: () => void;
};

const seededAccounts: StoredAccount[] = [
  { id: "account-maya", hcpId: "hcp-maya", email: "maya.chen@relay.health", mobile: "4045550101", passwordHash: seededPasswordHash },
  { id: "account-elena", hcpId: "hcp-1", email: "elena.ruiz@relay.health", mobile: "9125550142", passwordHash: seededPasswordHash },
  { id: "account-jordan", hcpId: "hcp-jordan", email: "jordan.brooks@relay.health", mobile: "4045550188", passwordHash: seededPasswordHash },
];

const AccountAuthContext = createContext<AccountAuthValue | null>(null);

function loadAccounts(): StoredAccount[] {
  try {
    const stored = window.localStorage.getItem(accountStorageKey);
    return stored ? JSON.parse(stored) as StoredAccount[] : [];
  } catch {
    return [];
  }
}

async function hashPassword(password: string) {
  const value = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function matchLocalAccount(accounts: ReadonlyArray<StoredAccount>, email: string, password: string) {
  const account = accounts.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase());
  return account && account.passwordHash === await hashPassword(password) ? account : undefined;
}

export async function verifySeededAccount(email: string, password: string) {
  return matchLocalAccount(seededAccounts, email, password);
}

export function AccountAuthProvider({ children }: { children: ReactNode }) {
  const [customAccounts, setCustomAccounts] = useState<StoredAccount[]>(loadAccounts);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => window.localStorage.getItem(sessionStorageKey));
  const accounts = useMemo(() => [...customAccounts, ...seededAccounts], [customAccounts]);
  const activeAccount = accounts.find((account) => account.id === activeAccountId);

  const value = useMemo<AccountAuthValue>(() => ({
    account: activeAccount ? { id: activeAccount.id, hcpId: activeAccount.hcpId, email: activeAccount.email, mobile: activeAccount.mobile } : undefined,
    hcpId: activeAccount?.hcpId,
    isAuthenticated: Boolean(activeAccount),
    getAccountEmail: (hcpId) => accounts.find((account) => account.hcpId === hcpId)?.email,
    signIn: async (email, password) => {
      const account = await matchLocalAccount(accounts, email, password);
      if (!account) return { ok: false, error: "Email or password is incorrect." };
      window.localStorage.setItem(sessionStorageKey, account.id);
      setActiveAccountId(account.id);
      return { ok: true };
    },
    signUp: async ({ npi, mobile, email, password }) => {
      const profile = personas.find((persona) => persona.npi === npi.replace(/\D/g, ""));
      if (!profile) return { ok: false, error: "We could not match that NPI to an eligible Relay physician profile." };
      if (!/^\+?[0-9()\-\s]{10,}$/.test(mobile)) return { ok: false, error: "Enter a valid mobile phone number." };
      if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
      if (password.length < 8) return { ok: false, error: "Password must contain at least 8 characters." };
      if (accounts.some((account) => account.email.toLowerCase() === email.trim().toLowerCase())) return { ok: false, error: "An account already uses this email address." };
      const account: StoredAccount = {
        id: crypto.randomUUID(),
        hcpId: profile.id,
        email: email.trim().toLowerCase(),
        mobile,
        passwordHash: await hashPassword(password),
      };
      const next = [account, ...customAccounts];
      window.localStorage.setItem(accountStorageKey, JSON.stringify(next));
      window.localStorage.setItem(sessionStorageKey, account.id);
      setCustomAccounts(next);
      setActiveAccountId(account.id);
      return { ok: true };
    },
    logout: () => {
      window.localStorage.removeItem(sessionStorageKey);
      setActiveAccountId(null);
    },
  }), [accounts, activeAccount, customAccounts]);

  return <AccountAuthContext.Provider value={value}>{children}</AccountAuthContext.Provider>;
}

export function useAccountAuth() {
  const value = useContext(AccountAuthContext);
  if (!value) throw new Error("useAccountAuth must be used inside AccountAuthProvider");
  return value;
}
