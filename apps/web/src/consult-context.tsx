import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ConsultRequest, HcpProfile, Persona, QuestionSelection, StructuredPeerAnswer } from "@relay/domain";

const storageKey = "relay.consult-requests.v2";
const channelName = "relay-consult-requests";

type NewRequest = {
  requester: Persona;
  recipient: HcpProfile;
  question: string;
  selection: QuestionSelection;
};

type ConsultContextValue = {
  requests: ConsultRequest[];
  createRequest: (input: NewRequest) => ConsultRequest;
  setStatus: (id: string, status: "accepted" | "declined") => void;
  submitAnswer: (id: string, answer: Omit<StructuredPeerAnswer, "answeredAt">) => void;
  setContactApproval: (id: string, side: "requester" | "recipient", approved: boolean) => void;
  markRead: (id: string, side: "requester" | "recipient") => void;
};

const ConsultContext = createContext<ConsultContextValue | null>(null);

function loadRequests(): ConsultRequest[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as ConsultRequest[] : [];
  } catch {
    return [];
  }
}

export function ConsultProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ConsultRequest[]>(loadRequests);
  const requestsRef = useRef(requests);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  const replaceRequests = useCallback((next: ConsultRequest[]) => {
    requestsRef.current = next;
    setRequests(next);
  }, []);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = (event: MessageEvent<ConsultRequest[]>) => replaceRequests(event.data);
    channelRef.current = channel;
    return () => channel.close();
  }, [replaceRequests]);

  useEffect(() => {
    const receiveStorage = (event: StorageEvent) => {
      if (event.key === storageKey) replaceRequests(loadRequests());
    };
    window.addEventListener("storage", receiveStorage);
    return () => window.removeEventListener("storage", receiveStorage);
  }, [replaceRequests]);

  const commit = useCallback((update: (current: ConsultRequest[]) => ConsultRequest[]) => {
    const next = update(requestsRef.current);
    requestsRef.current = next;
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    channelRef.current?.postMessage(next);
    setRequests(next);
    return next;
  }, []);

  const createRequest = useCallback(({ requester, recipient, question, selection }: NewRequest) => {
    const now = new Date().toISOString();
    const request: ConsultRequest = {
      id: crypto.randomUUID(),
      requesterId: requester.id,
      requesterName: requester.name,
      requesterSpecialty: requester.specialty,
      requesterLocation: requester.location,
      requesterCredentialStatus: requester.credentialStatus,
      recipientId: recipient.id,
      recipientName: recipient.displayName,
      recipientSpecialty: recipient.specialty,
      recipientState: recipient.state,
      recipientCredentialStatus: "verified",
      question,
      selection: { ...selection },
      status: "pending",
      createdAt: now,
      updatedAt: now,
      requesterContactApproved: false,
      recipientContactApproved: false,
    };
    commit((current) => [request, ...current]);
    return request;
  }, [commit]);

  const setStatus = useCallback<ConsultContextValue["setStatus"]>((id, status) => {
    commit((current) => current.map((request) => request.id === id ? { ...request, status, recipientReadAt: request.recipientReadAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() } : request));
  }, [commit]);

  const submitAnswer = useCallback<ConsultContextValue["submitAnswer"]>((id, answer) => {
    commit((current) => current.map((request) => request.id === id ? {
      ...request,
      status: "answered",
      answer: { ...answer, monitoring: [...answer.monitoring], answeredAt: new Date().toISOString() },
      recipientReadAt: request.recipientReadAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : request));
  }, [commit]);

  const setContactApproval = useCallback<ConsultContextValue["setContactApproval"]>((id, side, approved) => {
    commit((current) => current.map((request) => request.id === id ? {
      ...request,
      requesterContactApproved: side === "requester" ? approved : request.requesterContactApproved,
      recipientContactApproved: side === "recipient" ? approved : request.recipientContactApproved,
      updatedAt: new Date().toISOString(),
    } : request));
  }, [commit]);

  const markRead = useCallback<ConsultContextValue["markRead"]>((id, side) => {
    commit((current) => current.map((request) => {
      if (request.id !== id) return request;
      const field = side === "requester" ? "requesterReadAt" : "recipientReadAt";
      if (request[field]) return request;
      return { ...request, [field]: new Date().toISOString() };
    }));
  }, [commit]);

  const value = useMemo<ConsultContextValue>(() => ({
    requests,
    createRequest,
    setStatus,
    submitAnswer,
    setContactApproval,
    markRead,
  }), [createRequest, markRead, requests, setContactApproval, setStatus, submitAnswer]);

  return <ConsultContext.Provider value={value}>{children}</ConsultContext.Provider>;
}

export function useConsults() {
  const value = useContext(ConsultContext);
  if (!value) throw new Error("useConsults must be used inside ConsultProvider");
  return value;
}
