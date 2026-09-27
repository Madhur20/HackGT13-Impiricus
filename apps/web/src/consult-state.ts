import type { ConsultRequest } from "@relay/domain";

type BadgeRequest = Pick<ConsultRequest, "recipientId" | "recipientReadAt" | "requesterId" | "requesterReadAt" | "status">;

export function getConsultBadgeCounts(requests: ReadonlyArray<BadgeRequest>, actorId: string) {
  return {
    inbox: requests.filter((request) => request.recipientId === actorId && !request.recipientReadAt).length,
    connect: requests.filter((request) => request.requesterId === actorId && request.status === "answered" && !request.requesterReadAt).length,
  };
}
