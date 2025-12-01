import { 
  type ContentSource, type InsertContentSource,
  type ScrapedArticle, type InsertScrapedArticle,
  type GeneratedPost, type InsertGeneratedPost,
  type ProfileData, type InsertProfileData,
  type Settings, type InsertSettings,
  type User, type InsertUser,
  contentSources, scrapedArticles, generatedPosts, profileData, settings, users
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc, and, sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Content Sources
  getSources(): Promise<ContentSource[]>;
  getSource(id: string): Promise<ContentSource | undefined>;
  createSource(source: InsertContentSource): Promise<ContentSource>;
  updateSource(id: string, updates: Partial<ContentSource>): Promise<ContentSource | undefined>;

  // Scraped Articles
  getArticles(limit?: number): Promise<ScrapedArticle[]>;
  getArticlesBySource(sourceId: string): Promise<ScrapedArticle[]>;
  getArticle(id: string): Promise<ScrapedArticle | undefined>;
  createArticle(article: InsertScrapedArticle): Promise<ScrapedArticle>;
  updateArticle(id: string, updates: Partial<ScrapedArticle>): Promise<ScrapedArticle | undefined>;

  // Generated Posts
  getPosts(status?: string): Promise<GeneratedPost[]>;
  getPost(id: string): Promise<GeneratedPost | undefined>;
  createPost(post: InsertGeneratedPost): Promise<GeneratedPost>;
  updatePost(id: string, updates: Partial<GeneratedPost>): Promise<GeneratedPost | undefined>;
  deletePost(id: string): Promise<boolean>;

  // Profile Data
  getProfile(): Promise<ProfileData | undefined>;
  createOrUpdateProfile(profile: InsertProfileData): Promise<ProfileData>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  createOrUpdateSettings(settingsData: Partial<Settings>): Promise<Settings>;

  // Stats
  getStats(): Promise<{
    totalPosts: number;
    totalDrafts: number;
    totalSources: number;
    postsThisWeek: number;
  }>;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Content Sources
  async getSources(): Promise<ContentSource[]> {
    return db.select().from(contentSources).orderBy(desc(contentSources.lastScrapedAt));
  }

  async getSource(id: string): Promise<ContentSource | undefined> {
    const [source] = await db.select().from(contentSources).where(eq(contentSources.id, id));
    return source;
  }

  async createSource(source: InsertContentSource): Promise<ContentSource> {
    const [created] = await db.insert(contentSources).values(source).returning();
    return created;
  }

  async updateSource(id: string, updates: Partial<ContentSource>): Promise<ContentSource | undefined> {
    const [updated] = await db.update(contentSources)
      .set(updates)
      .where(eq(contentSources.id, id))
      .returning();
    return updated;
  }

  // Scraped Articles
  async getArticles(limit = 100): Promise<ScrapedArticle[]> {
    return db.select()
      .from(scrapedArticles)
      .orderBy(desc(scrapedArticles.scrapedAt))
      .limit(limit);
  }

  async getArticlesBySource(sourceId: string): Promise<ScrapedArticle[]> {
    return db.select()
      .from(scrapedArticles)
      .where(eq(scrapedArticles.sourceId, sourceId))
      .orderBy(desc(scrapedArticles.scrapedAt));
  }

  async getArticle(id: string): Promise<ScrapedArticle | undefined> {
    const [article] = await db.select().from(scrapedArticles).where(eq(scrapedArticles.id, id));
    return article;
  }

  async createArticle(article: InsertScrapedArticle): Promise<ScrapedArticle> {
    const [created] = await db.insert(scrapedArticles).values(article).returning();
    return created;
  }

  async updateArticle(id: string, updates: Partial<ScrapedArticle>): Promise<ScrapedArticle | undefined> {
    const [updated] = await db.update(scrapedArticles)
      .set(updates)
      .where(eq(scrapedArticles.id, id))
      .returning();
    return updated;
  }

  // Generated Posts
  async getPosts(status?: string): Promise<GeneratedPost[]> {
    if (status) {
      return db.select()
        .from(generatedPosts)
        .where(eq(generatedPosts.status, status))
        .orderBy(desc(generatedPosts.createdAt));
    }
    return db.select()
      .from(generatedPosts)
      .orderBy(desc(generatedPosts.createdAt));
  }

  async getPost(id: string): Promise<GeneratedPost | undefined> {
    const [post] = await db.select().from(generatedPosts).where(eq(generatedPosts.id, id));
    return post;
  }

  async createPost(post: InsertGeneratedPost): Promise<GeneratedPost> {
    const [created] = await db.insert(generatedPosts).values(post).returning();
    return created;
  }

  async updatePost(id: string, updates: Partial<GeneratedPost>): Promise<GeneratedPost | undefined> {
    const [updated] = await db.update(generatedPosts)
      .set(updates)
      .where(eq(generatedPosts.id, id))
      .returning();
    return updated;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(generatedPosts).where(eq(generatedPosts.id, id));
    return true;
  }

  // Profile Data
  async getProfile(): Promise<ProfileData | undefined> {
    const [profile] = await db.select().from(profileData).limit(1);
    return profile;
  }

  async createOrUpdateProfile(profile: InsertProfileData): Promise<ProfileData> {
    const existing = await this.getProfile();
    if (existing) {
      const [updated] = await db.update(profileData)
        .set({ ...profile, lastUpdatedAt: new Date() })
        .where(eq(profileData.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(profileData).values(profile).returning();
    return created;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const [settingsRow] = await db.select().from(settings).limit(1);
    return settingsRow;
  }

  async createOrUpdateSettings(settingsData: Partial<Settings>): Promise<Settings> {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(settings)
        .set(settingsData)
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(settings).values(settingsData as any).returning();
    return created;
  }

  // Stats
  async getStats(): Promise<{
    totalPosts: number;
    totalDrafts: number;
    totalSources: number;
    postsThisWeek: number;
  }> {
    const allPosts = await db.select().from(generatedPosts);
    const allSources = await db.select().from(contentSources);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const publishedPosts = allPosts.filter(p => p.status === "published");
    const draftPosts = allPosts.filter(p => p.status === "draft");
    const postsThisWeek = publishedPosts.filter(p => 
      p.publishedAt && new Date(p.publishedAt) > oneWeekAgo
    );

    return {
      totalPosts: publishedPosts.length,
      totalDrafts: draftPosts.length,
      totalSources: allSources.length,
      postsThisWeek: postsThisWeek.length,
    };
  }
}

export const storage = new DatabaseStorage();
