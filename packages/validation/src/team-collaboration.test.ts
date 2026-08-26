import { describe, expect, it } from "vitest";
import {
  organizationConversationSchema,
  organizationMemberAccessSchema,
  organizationMessageSchema,
  organizationTeamSchema
} from "./index";

const organizationId = "cebf84db-d21a-45c7-9512-755069d9ec32";
const ownerMembershipId = "5aee009f-f87f-4f97-89f8-f6b22bc7b7a0";
const managerMembershipId = "efdc854f-2457-4b29-86f0-2f9bc770f934";
const teamId = "fb485997-d46f-4c15-8561-ff837e88734e";

describe("organization team contracts", () => {
  it("accepts a department when its lead is also a member", () => {
    const parsed = organizationTeamSchema.parse({
      organizationId,
      name: "Sales & Marketing",
      purpose: "Develop target markets and coordinate qualified buyer outreach.",
      leadMembershipId: managerMembershipId,
      memberIds: [ownerMembershipId, managerMembershipId]
    });

    expect(parsed.name).toBe("Sales & Marketing");
  });

  it("rejects a department whose lead is not a member", () => {
    const parsed = organizationTeamSchema.safeParse({
      organizationId,
      name: "Operations",
      purpose: "Coordinate compliance evidence and export delivery milestones.",
      leadMembershipId: managerMembershipId,
      memberIds: [ownerMembershipId]
    });

    expect(parsed.success).toBe(false);
  });

  it("validates position hierarchy metadata independently of a display title", () => {
    const parsed = organizationMemberAccessSchema.parse({
      organizationId,
      membershipId: managerMembershipId,
      positionTitle: "Head of Export Sales",
      accessRole: "department_lead",
      hierarchyRank: 70
    });

    expect(parsed.accessRole).toBe("department_lead");
  });
});

describe("organization messaging contracts", () => {
  it("requires department channels to belong to a team", () => {
    const parsed = organizationConversationSchema.safeParse({
      organizationId,
      kind: "department",
      title: "Operations & Compliance",
      participantMembershipIds: [ownerMembershipId, managerMembershipId],
      participantStaffProfileIds: []
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts a contextual department channel with at least two participants", () => {
    const parsed = organizationConversationSchema.parse({
      organizationId,
      kind: "department",
      title: "Sales & Marketing",
      teamId,
      participantMembershipIds: [ownerMembershipId, managerMembershipId],
      participantStaffProfileIds: [],
      relatedEntityType: "export_lane",
      relatedEntityId: "lane-germany-apparel"
    });

    expect(parsed.relatedEntityType).toBe("export_lane");
  });

  it("rejects participant-less conversations and blank messages", () => {
    const conversation = organizationConversationSchema.safeParse({
      organizationId,
      kind: "direct",
      title: "Private discussion",
      participantMembershipIds: [ownerMembershipId],
      participantStaffProfileIds: []
    });
    const message = organizationMessageSchema.safeParse({
      organizationId,
      conversationId: teamId,
      body: "   "
    });

    expect(conversation.success).toBe(false);
    expect(message.success).toBe(false);
  });
});
