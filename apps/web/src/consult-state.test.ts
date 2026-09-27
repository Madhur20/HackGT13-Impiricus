import { describe, expect, it } from "vitest";
import { getConsultBadgeCounts } from "./consult-state";

describe("Doctor Connect notification badges", () => {
  it("counts only unread requests and unread answers for the active physician", () => {
    const unreadRequest = { recipientId: "hcp-maya", requesterId: "hcp-1", status: "pending" as const };
    const readRequest = { ...unreadRequest, recipientReadAt: "2026-09-26T18:00:00.000Z" };
    const unreadAnswer = { recipientId: "hcp-maya", requesterId: "hcp-1", status: "answered" as const, recipientReadAt: "2026-09-26T18:00:00.000Z" };
    const readAnswer = { ...unreadAnswer, requesterReadAt: "2026-09-26T18:05:00.000Z" };

    expect(getConsultBadgeCounts([unreadRequest], "hcp-maya")).toEqual({ inbox: 1, connect: 0 });
    expect(getConsultBadgeCounts([readRequest], "hcp-maya")).toEqual({ inbox: 0, connect: 0 });
    expect(getConsultBadgeCounts([unreadAnswer], "hcp-1")).toEqual({ inbox: 0, connect: 1 });
    expect(getConsultBadgeCounts([readAnswer], "hcp-1")).toEqual({ inbox: 0, connect: 0 });
  });
});
