import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeSource, getSourceType, convertToInsertArticle } from "./scraper";
import { 
  analyzeWritingStyle, 
  analyzeArticleRelevance, 
  generateLinkedInPost,
  refinePost,
  extractLinkedInPosts
} from "./openai";
import { log } from "./index";
import { insertContentSourceSchema, insertGeneratedPostSchema } from "@shared/schema";

// Default content sources
const DEFAULT_SOURCES = [
  { name: "arXiv AI", url: "https://arxiv.org/list/cs.AI/recent", category: "research" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/", category: "tech" },
  { name: "Greenbook", url: "https://www.greenbook.org/", category: "marketing" },
  { name: "Quirks", url: "https://www.quirks.com/", category: "marketing" },
  { name: "HBR AI", url: "https://hbr.org/topic/subject/artificial-intelligence", category: "business" },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize default sources if none exist
  const existingSources = await storage.getSources();
  if (existingSources.length === 0) {
    log("Initializing default content sources...", "routes");
    for (const source of DEFAULT_SOURCES) {
      await storage.createSource({
        name: source.name,
        url: source.url,
        category: source.category,
        isActive: true,
      });
    }
    
    // Initialize Jiten's profile
    await storage.createOrUpdateProfile({
      linkedinUrl: "https://www.linkedin.com/in/jitenmadia",
      name: "Jiten Madia",
      headline: "Market Research & AI Innovation Leader",
      posts: [],
      comments: [],
      writingStyleAnalysis: null,
    });
    
    log("Default sources initialized", "routes");
  }

  // Stats endpoint
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Content Sources endpoints
  app.get("/api/sources", async (_req, res) => {
    try {
      const sources = await storage.getSources();
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sources/:id", async (req, res) => {
    try {
      const source = await storage.getSource(req.params.id);
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sources/:id/scrape", async (req, res) => {
    try {
      const source = await storage.getSource(req.params.id);
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }

      const sourceType = getSourceType(source.url);
      if (!sourceType) {
        return res.status(400).json({ message: "Unsupported source type" });
      }

      log(`Scraping ${source.name}...`, "routes");
      const scrapedContent = await scrapeSource(sourceType);
      
      let newArticleCount = 0;
      const settings = await storage.getSettings();
      const preferredTopics = settings?.preferredTopics || ["AI", "market research", "technology"];
      
      for (const content of scrapedContent) {
        // Check if article already exists
        const existingArticles = await storage.getArticlesBySource(source.id);
        const exists = existingArticles.some(a => a.url === content.url);
        if (exists) continue;

        // Analyze relevance (skip if no API key)
        let relevanceScore = 50;
        let topics: string[] = [];
        
        if (process.env.OPENAI_API_KEY) {
          const analysis = await analyzeArticleRelevance(
            content.title,
            content.summary || "",
            preferredTopics
          );
          relevanceScore = analysis.relevanceScore;
          topics = analysis.topics;
        }

        const article = convertToInsertArticle(content, source.id);
        article.relevanceScore = relevanceScore;
        article.topics = topics;
        
        await storage.createArticle(article);
        newArticleCount++;
      }

      // Update source
      const allSourceArticles = await storage.getArticlesBySource(source.id);
      await storage.updateSource(source.id, {
        lastScrapedAt: new Date(),
        articleCount: allSourceArticles.length,
      });

      log(`Scraped ${newArticleCount} new articles from ${source.name}`, "routes");
      res.json({ message: "Scrape complete", newArticles: newArticleCount });
    } catch (error: any) {
      log(`Scrape error: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sources/scrape-all", async (_req, res) => {
    try {
      const sources = await storage.getSources();
      let totalNewArticles = 0;

      for (const source of sources) {
        if (!source.isActive) continue;
        
        const sourceType = getSourceType(source.url);
        if (!sourceType) continue;

        try {
          log(`Scraping ${source.name}...`, "routes");
          const scrapedContent = await scrapeSource(sourceType);
          
          const settings = await storage.getSettings();
          const preferredTopics = settings?.preferredTopics || ["AI", "market research", "technology"];
          
          for (const content of scrapedContent) {
            const existingArticles = await storage.getArticlesBySource(source.id);
            const exists = existingArticles.some(a => a.url === content.url);
            if (exists) continue;

            let relevanceScore = 50;
            let topics: string[] = [];
            
            if (process.env.OPENAI_API_KEY) {
              const analysis = await analyzeArticleRelevance(
                content.title,
                content.summary || "",
                preferredTopics
              );
              relevanceScore = analysis.relevanceScore;
              topics = analysis.topics;
            }

            const article = convertToInsertArticle(content, source.id);
            article.relevanceScore = relevanceScore;
            article.topics = topics;
            
            await storage.createArticle(article);
            totalNewArticles++;
          }

          const allSourceArticles = await storage.getArticlesBySource(source.id);
          await storage.updateSource(source.id, {
            lastScrapedAt: new Date(),
            articleCount: allSourceArticles.length,
          });
        } catch (err: any) {
          log(`Error scraping ${source.name}: ${err.message}`, "routes");
        }
      }

      res.json({ message: "All sources scraped", totalNewArticles });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Articles endpoints
  app.get("/api/articles", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const articles = await storage.getArticles(limit);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/posts/drafts", async (_req, res) => {
    try {
      const drafts = await storage.getPosts("draft");
      const scheduled = await storage.getPosts("scheduled");
      res.json([...drafts, ...scheduled]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/posts/published", async (_req, res) => {
    try {
      const published = await storage.getPosts("published");
      res.json(published);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/posts/generate", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key is not configured. Please add your OPENAI_API_KEY to continue." 
        });
      }

      const { articleId } = req.body;
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const profile = await storage.getProfile();
      const writingStyle = profile?.writingStyleAnalysis || 
        "Write in a professional yet approachable tone. Use short paragraphs and questions to drive engagement.";

      const { content, styleMatch } = await generateLinkedInPost(
        article.title,
        article.content || article.summary || article.title,
        writingStyle
      );

      const post = await storage.createPost({
        articleId,
        content,
        status: "draft",
        styleMatch,
        scheduledFor: null,
        publishedAt: null,
        linkedinPostId: null,
        editHistory: null,
      });

      // Mark article as used
      await storage.updateArticle(articleId, { isUsed: true });

      res.json(post);
    } catch (error: any) {
      log(`Generate post error: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const { content, status, scheduledFor } = req.body;
      
      const existingPost = await storage.getPost(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const updates: Partial<typeof existingPost> = {};
      if (content !== undefined) updates.content = content;
      if (status !== undefined) updates.status = status;
      if (scheduledFor !== undefined) updates.scheduledFor = new Date(scheduledFor);

      const post = await storage.updatePost(req.params.id, updates);
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/posts/:id/refine", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key is not configured. Please add your OPENAI_API_KEY to continue." 
        });
      }

      const { action } = req.body;
      
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const profile = await storage.getProfile();
      const writingStyle = profile?.writingStyleAnalysis || 
        "Write in a professional yet approachable tone.";

      const refinedContent = await refinePost(post.content, action, writingStyle);
      
      res.json({ content: refinedContent });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/posts/:id/publish", async (req, res) => {
    try {
      const { content } = req.body;
      
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Validate status transition - can only publish drafts or scheduled posts
      if (post.status === "published") {
        return res.status(400).json({ message: "This post has already been published" });
      }

      if (post.status === "discarded") {
        return res.status(400).json({ message: "Cannot publish a discarded post" });
      }

      // In a real implementation, this would use LinkedIn's API
      // For now, we'll simulate publishing
      const updatedPost = await storage.updatePost(req.params.id, {
        content: content || post.content,
        status: "published",
        publishedAt: new Date(),
        linkedinPostId: `urn:li:share:${Date.now()}`,
      });

      res.json(updatedPost);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Profile endpoints
  app.get("/api/profile", async (_req, res) => {
    try {
      const profile = await storage.getProfile();
      res.json(profile || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile/analyze", async (_req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key is not configured. Please add your OPENAI_API_KEY to continue." 
        });
      }

      const profile = await storage.getProfile();
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Extract posts from LinkedIn (simulated with stored data + OpenAI)
      const { posts, comments } = await extractLinkedInPosts("");
      
      // Analyze writing style
      const postContents = posts.map(p => p.content);
      const writingStyleAnalysis = await analyzeWritingStyle(postContents);

      const updatedProfile = await storage.createOrUpdateProfile({
        linkedinUrl: profile.linkedinUrl,
        name: profile.name,
        headline: profile.headline,
        posts,
        comments,
        writingStyleAnalysis,
      });

      res.json(updatedProfile);
    } catch (error: any) {
      log(`Profile analysis error: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (_req, res) => {
    try {
      let settings = await storage.getSettings();
      if (!settings) {
        settings = await storage.createOrUpdateSettings({
          postingFrequency: "daily",
          timezone: "America/New_York",
          autoPublish: false,
          preferredTopics: ["AI", "market research", "technology", "business strategy"],
        });
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.createOrUpdateSettings(updates);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API Status endpoint - check service availability
  app.get("/api/status", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        openai: !!process.env.OPENAI_API_KEY,
        linkedin: !!settings?.linkedinAccessToken,
        database: true,
      });
    } catch (error) {
      res.json({
        openai: !!process.env.OPENAI_API_KEY,
        linkedin: false,
        database: false,
      });
    }
  });

  // LinkedIn OAuth placeholder
  app.get("/api/auth/linkedin", (_req, res) => {
    // In production, this would redirect to LinkedIn OAuth
    res.redirect("https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=w_member_social%20r_liteprofile");
  });

  return httpServer;
}
