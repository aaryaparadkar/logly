import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  githubTokenEncrypted: text("github_token_encrypted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const changelogs = pgTable(
  "changelogs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    name: text("name"),
    logoUrl: text("logo_url"),
    data: jsonb("data"),
    customDomain: text("custom_domain"),
    isPublic: boolean("is_public").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      ownerRepoIdx: uniqueIndex("changelog_owner_repo_idx").on(
        table.owner,
        table.repo,
      ),
    };
  },
);

export const changelogVersions = pgTable("changelog_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  changelogId: uuid("changelog_id")
    .notNull()
    .references(() => changelogs.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  date: text("date").notNull(),
  entries: jsonb("entries").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customDomains = pgTable("custom_domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  domain: text("domain").notNull().unique(),
  changelogId: uuid("changelog_id")
    .notNull()
    .references(() => changelogs.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  changelogs: many(changelogs),
}));

export const changelogsRelations = relations(changelogs, ({ many }) => ({
  versions: many(changelogVersions),
  customDomains: many(customDomains),
}));

export const changelogVersionsRelations = relations(
  changelogVersions,
  ({ one }) => ({
    changelog: one(changelogs, {
      fields: [changelogVersions.changelogId],
      references: [changelogs.id],
    }),
  }),
);

export const customDomainsRelations = relations(customDomains, ({ one }) => ({
  changelog: one(changelogs, {
    fields: [customDomains.changelogId],
    references: [changelogs.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Changelog = typeof changelogs.$inferSelect;
export type ChangelogVersion = typeof changelogVersions.$inferSelect;
export type CustomDomain = typeof customDomains.$inferSelect;
