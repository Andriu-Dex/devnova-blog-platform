import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { teamMembers } from "./team-members";
import { teamMemberVersions } from "./team-member-versions";

export const auditTeamMemberEvents = pgTable(
  "audit_team_member_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "restrict" }),
    previousVersionId: uuid("previous_version_id").references(
      () => teamMemberVersions.id,
      { onDelete: "restrict" }
    ),
    newVersionId: uuid("new_version_id").references(
      () => teamMemberVersions.id,
      { onDelete: "restrict" }
    ),
  },
  (table) => [
    index("audit_team_member_events_team_member_id_idx").on(table.teamMemberId),
  ]
);
