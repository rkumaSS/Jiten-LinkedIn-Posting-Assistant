import axios from "axios";
import * as cheerio from "cheerio";
import type { InsertScrapedArticle } from "@shared/schema";
import { log } from "./index";

interface ScrapedContent {
  title: string;
  summary?: string;
  content?: string;
  url: string;
  author?: string;
  publishedAt?: Date;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { 
      headers: HEADERS,
      timeout: 15000,
    });
    return response.data;
  } catch (error: any) {
    log(`Failed to fetch ${url}: ${error.message}`, "scraper");
    throw error;
  }
}

export async function scrapeArxiv(): Promise<ScrapedContent[]> {
  const articles: ScrapedContent[] = [];
  try {
    const url = "https://arxiv.org/list/cs.AI/recent";
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $("dt").each((i, elem) => {
      if (i >= 10) return false; // Limit to 10 articles
      
      const dd = $(elem).next("dd");
      const titleLink = dd.find(".list-title a").first();
      const title = dd.find(".list-title").text().replace("Title:", "").trim();
      const abstractSpan = dd.find(".mathjax");
      const summary = abstractSpan.text().trim().slice(0, 500);
      const authors = dd.find(".list-authors").text().replace("Authors:", "").trim();
      const arxivId = $(elem).find("a[title='Abstract']").attr("href") || "";
      
      if (title) {
        articles.push({
          title,
          summary: summary || undefined,
          url: `https://arxiv.org${arxivId}`,
          author: authors || undefined,
          publishedAt: new Date(),
        });
      }
    });
  } catch (error: any) {
    log(`arXiv scraping error: ${error.message}`, "scraper");
  }
  return articles;
}

export async function scrapeVentureBeat(): Promise<ScrapedContent[]> {
  const articles: ScrapedContent[] = [];
  try {
    const url = "https://venturebeat.com/category/ai/";
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $("article.ArticleListing").each((i, elem) => {
      if (i >= 10) return false;
      
      const titleElem = $(elem).find("h2 a");
      const title = titleElem.text().trim();
      const link = titleElem.attr("href") || "";
      const summary = $(elem).find(".ArticleListing__excerpt").text().trim();
      const author = $(elem).find(".ArticleListing__author a").text().trim();
      
      if (title && link) {
        articles.push({
          title,
          summary: summary || undefined,
          url: link,
          author: author || undefined,
          publishedAt: new Date(),
        });
      }
    });
  } catch (error: any) {
    log(`VentureBeat scraping error: ${error.message}`, "scraper");
  }
  return articles;
}

export async function scrapeGreenbook(): Promise<ScrapedContent[]> {
  const articles: ScrapedContent[] = [];
  try {
    const url = "https://www.greenbook.org/mr/market-research-methodology/";
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $("article, .post-item, .blog-post").each((i, elem) => {
      if (i >= 10) return false;
      
      const titleElem = $(elem).find("h2 a, h3 a, .entry-title a");
      const title = titleElem.text().trim();
      const link = titleElem.attr("href") || "";
      const summary = $(elem).find(".entry-summary, .excerpt, p").first().text().trim().slice(0, 300);
      
      if (title && link) {
        articles.push({
          title,
          summary: summary || undefined,
          url: link.startsWith("http") ? link : `https://www.greenbook.org${link}`,
          publishedAt: new Date(),
        });
      }
    });
  } catch (error: any) {
    log(`Greenbook scraping error: ${error.message}`, "scraper");
  }
  return articles;
}

export async function scrapeQuirks(): Promise<ScrapedContent[]> {
  const articles: ScrapedContent[] = [];
  try {
    const url = "https://www.quirks.com/articles";
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $(".article-teaser, .content-item, article").each((i, elem) => {
      if (i >= 10) return false;
      
      const titleElem = $(elem).find("h2 a, h3 a, .title a");
      const title = titleElem.text().trim();
      const link = titleElem.attr("href") || "";
      const summary = $(elem).find(".teaser, .excerpt, .description").text().trim().slice(0, 300);
      const author = $(elem).find(".author, .byline").text().trim();
      
      if (title && link) {
        articles.push({
          title,
          summary: summary || undefined,
          url: link.startsWith("http") ? link : `https://www.quirks.com${link}`,
          author: author || undefined,
          publishedAt: new Date(),
        });
      }
    });
  } catch (error: any) {
    log(`Quirks scraping error: ${error.message}`, "scraper");
  }
  return articles;
}

export async function scrapeHBR(): Promise<ScrapedContent[]> {
  const articles: ScrapedContent[] = [];
  try {
    const url = "https://hbr.org/topic/subject/artificial-intelligence";
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $(".stream-item, article, .hed").each((i, elem) => {
      if (i >= 10) return false;
      
      const titleElem = $(elem).find("h3 a, h2 a, .hed a");
      const title = titleElem.text().trim();
      const link = titleElem.attr("href") || "";
      const summary = $(elem).find(".dek, .summary, .excerpt").text().trim().slice(0, 300);
      const author = $(elem).find(".byline, .author").text().trim();
      
      if (title && link) {
        articles.push({
          title,
          summary: summary || undefined,
          url: link.startsWith("http") ? link : `https://hbr.org${link}`,
          author: author || undefined,
          publishedAt: new Date(),
        });
      }
    });
  } catch (error: any) {
    log(`HBR scraping error: ${error.message}`, "scraper");
  }
  return articles;
}

export type SourceType = "arxiv" | "venturebeat" | "greenbook" | "quirks" | "hbr";

export async function scrapeSource(sourceType: SourceType): Promise<ScrapedContent[]> {
  switch (sourceType) {
    case "arxiv":
      return scrapeArxiv();
    case "venturebeat":
      return scrapeVentureBeat();
    case "greenbook":
      return scrapeGreenbook();
    case "quirks":
      return scrapeQuirks();
    case "hbr":
      return scrapeHBR();
    default:
      return [];
  }
}

export function getSourceType(url: string): SourceType | null {
  if (url.includes("arxiv.org")) return "arxiv";
  if (url.includes("venturebeat.com")) return "venturebeat";
  if (url.includes("greenbook.org")) return "greenbook";
  if (url.includes("quirks.com")) return "quirks";
  if (url.includes("hbr.org")) return "hbr";
  return null;
}

export function convertToInsertArticle(
  content: ScrapedContent, 
  sourceId: string
): InsertScrapedArticle {
  return {
    sourceId,
    title: content.title,
    summary: content.summary,
    content: content.content,
    url: content.url,
    author: content.author,
    publishedAt: content.publishedAt,
    relevanceScore: null,
    topics: null,
    isUsed: false,
  };
}
