import type { AllowedField, SchemaDiff } from "@relay/domain";
import { authorizeUse } from "@relay/relay-core";

export function computeSchemaDiff(current: AllowedField[], proposed: AllowedField[]): SchemaDiff[] {
  const before = new Map(current.map((field) => [field.fieldId, field]));
  const after = new Map(proposed.map((field) => [field.fieldId, field]));
  const changes: SchemaDiff[] = [];

  for (const [fieldId, field] of after) {
    const old = before.get(fieldId);
    if (!old) changes.push({ operation: "ADD_FIELD", fieldId, label: field.label, after: field });
    else if (JSON.stringify(old) !== JSON.stringify(field)) changes.push({ operation: "CHANGE_FIELD", fieldId, label: field.label, before: old, after: field });
  }
  for (const [fieldId, field] of before) {
    if (!after.has(fieldId)) changes.push({ operation: "REMOVE_FIELD", fieldId, label: field.label, before: field });
  }
  return changes;
}

export function evaluateProposal(field: AllowedField) {
  return authorizeUse({ purpose: "CLIENT_DISCLOSURE", proposedField: field });
}
