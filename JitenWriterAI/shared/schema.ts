import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Content Sources - websites to scrape for inspiration
export const contentSources = pgTable("content_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(), // 'research', 'tech', 'business', 'marketing'
  isActive: boolean("is_active").default(true).notNull(),
  lastScrapedAt: timestamp("last_scraped_at"),
  articleCount: integer("article_count").default(0).notNull(),
});

export const insertContentSourceSchema = createInsertSchema(contentSources).omit({
  id: true,
  lastScrapedAt: true,
  articleCount: true,
});
export type InsertContentSource = z.infer<typeof insertContentSourceSchema>;
export type ContentSource = typeof contentSources.$inferSelect;

// Scraped Articles - content pulled from sources
export const scrapedArticles = pgTable("scraped_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content"),
  url: text("url").notNull(),
  author: text("author"),
  publishedAt: timestamp("published_at"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  relevanceScore: integer("relevance_score"), // AI-assigned 1-100
  topics: text("topics").array(), // AI-extracted topics
  isUsed: boolean("is_used").default(false).notNull(),
});

export const insertScrapedArticleSchema = createInsertSchema(scrapedArticles).omit({
  id: true,
  scrapedAt: true,
});
export type InsertScrapedArticle = z.infer<typeof insertScrapedArticleSchema>;
export type ScrapedArticle = typeof scrapedArticles.$inferSelect;

// Generated Posts - AI-created LinkedIn posts
export const generatedPosts = pgTable("generated_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id"), // source article if any
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'scheduled', 'published', 'discarded'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  linkedinPostId: text("linkedin_post_id"), // ID from LinkedIn after publishing
  styleMatch: integer("style_match"), // AI-assessed match to Jiten's style 1-100
  editHistory: jsonb("edit_history"), // track revisions
});

export const insertGeneratedPostSchema = createInsertSchema(generatedPosts).omit({
  id: true,
  createdAt: true,
});
export type InsertGeneratedPost = z.infer<typeof insertGeneratedPostSchema>;
export type GeneratedPost = typeof generatedPosts.$inferSelect;

// Jiten's Profile Data - stored writing samples for style matching
export const profileData = pgTable("profile_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkedinUrl: text("linkedin_url").notNull(),
  name: text("name").notNull(),
  headline: text("headline"),
  posts: jsonb("posts").$type<{ content: string; date: string; engagement: number }[]>(),
  comments: jsonb("comments").$type<{ content: string; date: string }[]>(),
  writingStyleAnalysis: text("writing_style_analysis"), // AI analysis of writing style
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
});

export const insertProfileDataSchema = createInsertSchema(profileData).omit({
  id: true,
  lastUpdatedAt: true,
});
export type InsertProfileData = z.infer<typeof insertProfileDataSchema>;
export type ProfileData = typeof profileData.$inferSelect;

// User Settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkedinAccessToken: text("linkedin_access_token"),
  linkedinRefreshToken: text("linkedin_refresh_token"),
  linkedinTokenExpiry: timestamp("linkedin_token_expiry"),
  openaiApiKey: text("openai_api_key"),
  postingFrequency: text("posting_frequency").default("daily"), // 'daily', 'twice_daily', 'weekly'
  preferredTopics: text("preferred_topics").array(),
  autoPublish: boolean("auto_publish").default(false).notNull(),
  timezone: text("timezone").default("America/New_York"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Users table for auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
