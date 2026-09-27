import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ConsultRequest, HcpProfile, Persona, QuestionSelection } from "@relay/domain";
import { ANSWER_GUARDRAIL_VERSION, ANSWER_TAXONOMY_VERSION, QUESTION_TAXONOMY_VERSION, assembleQuestion, prepareAnswerText, prepareQuestionSelection } from "@relay/doctor-connect";
import { fetchAllConsults, mergeConsults, subscribeToConsults, upsertConsults } from "./consult-sync";
import { sharedSyncEnabled } from "./sync-config";

const storageKey = "relay.consult-requests.v2";
const channelName = "relay-consult-requests";
const pollIntervalMs = 4000;

type NewRequest = {
  requester: Persona;
  recipient: HcpProfile;
  selection: QuestionSelection;
};

type ConsultContextValue = {
  requests: ConsultRequest[];
  createRequest: (input: NewRequest) => ConsultRequest;
  setStatus: (id: string, status: "accepted" | "declined") => void;
  submitAnswer: (id: string, responseText: string) => void;
  /** Email sharing approval is one-way: once a physician approves, it cannot be withdrawn. */
  approveContact: (id: string, side: "requester" | "recipient") => void;
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
    return () => {
      // Child effects can commit before this provider re-subscribes (e.g. StrictMode remounts); never keep a closed channel.
      if (channelRef.current === channel) channelRef.current = null;
      channel.close();
    };
  }, [replaceRequests]);

  useEffect(() => {
    const receiveStorage = (event: StorageEvent) => {
      if (event.key === storageKey) replaceRequests(loadRequests());
    };
    window.addEventListener("storage", receiveStorage);
    return () => window.removeEventListener("storage", receiveStorage);
  }, [replaceRequests]);

  // Cross-device delivery through the shared demo table: realtime push plus a polling fallback.
  useEffect(() => {
    if (!sharedSyncEnabled) return;
    let active = true;
    const receive = (incoming: ConsultRequest[]) => {
      if (!active) return;
      const next = mergeConsults(requestsRef.current, incoming);
      if (next === requestsRef.current) return;
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      replaceRequests(next);
    };
    const pull = () => fetchAllConsults().then((remote) => remote && receive(remote));
    void pull();
    const unsubscribe = subscribeToConsults((request) => receive([request]));
    const interval = window.setInterval(pull, pollIntervalMs);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [replaceRequests]);

  const commit = useCallback((update: (current: ConsultRequest[]) => ConsultRequest[]) => {
    const previous = requestsRef.current;
    const next = update(previous);
    requestsRef.current = next;
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    channelRef.current?.postMessage(next);
    setRequests(next);
    void upsertConsults(next.filter((request) => !previous.includes(request)));
    return next;
  }, []);

  const createRequest = useCallback(({ requester, recipient, selection }: NewRequest) => {
    const approvedSelection = prepareQuestionSelection(selection);
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
      taxonomyVersion: QUESTION_TAXONOMY_VERSION,
      question: assembleQuestion(approvedSelection),
      selection: { ...approvedSelection },
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

  const submitAnswer = useCallback<ConsultContextValue["submitAnswer"]>((id, responseText) => {
    const approvedText = prepareAnswerText(responseText);
    commit((current) => current.map((request) => request.id === id ? {
      ...request,
      status: "answered",
      answer: { responseText: approvedText, taxonomyVersion: ANSWER_TAXONOMY_VERSION, guardrailVersion: ANSWER_GUARDRAIL_VERSION, answeredAt: new Date().toISOString() },
      recipientReadAt: request.recipientReadAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : request));
  }, [commit]);

  const approveContact = useCallback<ConsultContextValue["approveContact"]>((id, side) => {
    commit((current) => current.map((request) => {
      if (request.id !== id) return request;
      const field = side === "requester" ? "requesterContactApproved" : "recipientContactApproved";
      if (request[field]) return request;
      return { ...request, [field]: true, updatedAt: new Date().toISOString() };
    }));
  }, [commit]);

  const markRead = useCallback<ConsultContextValue["markRead"]>((id, side) => {
    commit((current) => current.map((request) => {
      if (request.id !== id) return request;
      const field = side === "requester" ? "requesterReadAt" : "recipientReadAt";
      if (request[field]) return request;
      const now = new Date().toISOString();
      return { ...request, [field]: now, updatedAt: now };
    }));
  }, [commit]);

  const value = useMemo<ConsultContextValue>(() => ({
    requests,
    createRequest,
    setStatus,
    submitAnswer,
    approveContact,
    markRead,
  }), [approveContact, createRequest, markRead, requests, setStatus, submitAnswer]);

  return <ConsultContext.Provider value={value}>{children}</ConsultContext.Provider>;
}

export function useConsults() {
  const value = useContext(ConsultContext);
  if (!value) throw new Error("useConsults must be used inside ConsultProvider");
  return value;
}
