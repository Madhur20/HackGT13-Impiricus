import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { personas } from "@relay/demo-seed";
import type { AuditEvent, Decision, Persona, Purpose } from "@relay/domain";
import { recordAuditEvent } from "@relay/relay-core";

type RecordInput = {
  product: AuditEvent["product"];
  action: string;
  purpose: Purpose;
  decision: Decision;
  summary: string;
};

type DemoContextValue = {
  persona: Persona;
  personas: Persona[];
  setPersonaId: (id: string) => void;
  events: AuditEvent[];
  record: (input: RecordInput) => void;
  resetDemo: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const initialEvents: AuditEvent[] = [
  recordAuditEvent({
    actorId: "system",
    product: "System",
    action: "DEMO_SEED_READY",
    purpose: "AGGREGATE_ANALYTICS",
    decision: "allow",
    summary: "Synthetic profiles, policy fixtures, and offline explanations loaded.",
  }),
];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState(personas[0].id);
  const [events, setEvents] = useState(initialEvents);
  const persona = personas.find((item) => item.id === personaId) ?? personas[0];

  const value = useMemo<DemoContextValue>(() => ({
    persona,
    personas,
    setPersonaId,
    events,
    record: (input) => {
      setEvents((current) => [recordAuditEvent({ ...input, actorId: persona.id }), ...current]);
    },
    resetDemo: () => {
      setPersonaId(personas[0].id);
      setEvents([
        recordAuditEvent({
          actorId: "system",
          product: "System",
          action: "DEMO_RESET",
          purpose: "AGGREGATE_ANALYTICS",
          decision: "allow",
          summary: "Relay returned to the deterministic starting state.",
        }),
      ]);
    },
  }), [events, persona]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
