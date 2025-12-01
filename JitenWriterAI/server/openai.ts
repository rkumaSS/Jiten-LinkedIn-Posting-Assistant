import OpenAI from "openai";
import { log } from "./index";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured. Please add it in Settings.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface WritingStyleAnalysis {
  style: string;
  tone: string;
  vocabulary: string[];
  patterns: string[];
  summary: string;
}

export async function analyzeWritingStyle(posts: string[]): Promise<string> {
  try {
    const postsText = posts.slice(0, 15).join("\n\n---\n\n");
    
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert writing analyst. Analyze the following LinkedIn posts and provide a detailed analysis of the author's writing style. Include:
1. Overall tone (professional, casual, inspirational, etc.)
2. Common patterns and structures used
3. Vocabulary preferences
4. Sentence structure tendencies
5. How they start and end posts
6. Use of questions, calls to action, or storytelling
7. Any unique quirks or signature elements

Provide the analysis in a format that can be used as a system prompt to generate new posts in the same style.`
        },
        {
          role: "user",
          content: `Here are the LinkedIn posts to analyze:\n\n${postsText}`
        }
      ],
      max_completion_tokens: 1500,
    });

    return response.choices[0].message.content || "Analysis unavailable";
  } catch (error: any) {
    log(`Writing style analysis error: ${error.message}`, "openai");
    throw error;
  }
}

export async function analyzeArticleRelevance(
  articleTitle: string,
  articleSummary: string,
  userTopics: string[]
): Promise<{ relevanceScore: number; topics: string[] }> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing content relevance for LinkedIn thought leadership. 
Analyze the article and determine:
1. A relevance score (0-100) based on how suitable it is for creating engaging LinkedIn content
2. Extract 3-5 key topics/themes from the article

Consider factors like:
- How interesting this would be for a professional audience
- Whether it has contrarian or insightful angles
- If it relates to: AI, market research, technology trends, business strategy, leadership
- Potential for generating engagement and discussion

Respond in JSON format: { "relevanceScore": number, "topics": string[] }`
        },
        {
          role: "user",
          content: `Title: ${articleTitle}\n\nSummary: ${articleSummary}\n\nUser's preferred topics: ${userTopics.join(", ")}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      relevanceScore: Math.max(0, Math.min(100, result.relevanceScore || 50)),
      topics: result.topics || [],
    };
  } catch (error: any) {
    log(`Article relevance analysis error: ${error.message}`, "openai");
    return { relevanceScore: 50, topics: [] };
  }
}

export async function generateLinkedInPost(
  articleTitle: string,
  articleContent: string,
  writingStylePrompt: string
): Promise<{ content: string; styleMatch: number }> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn ghostwriter for Jiten Madia. Your task is to create engaging LinkedIn posts based on articles, matching the following writing style:

${writingStylePrompt}

Guidelines:
- Create posts that are 150-300 words (optimal LinkedIn length)
- Start with a hook that grabs attention
- Include personal perspective or unique insight
- End with a question or call to action to drive engagement
- Use line breaks for readability
- Avoid hashtags unless specifically requested
- Sound authentic, not corporate or generic
- Match the author's voice and personality exactly

Respond in JSON format: { "content": string, "styleMatch": number (0-100 indicating how well you matched the style) }`
        },
        {
          role: "user",
          content: `Create a LinkedIn post inspired by this article:\n\nTitle: ${articleTitle}\n\nContent: ${articleContent.slice(0, 2000)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      content: result.content || "",
      styleMatch: result.styleMatch || 75,
    };
  } catch (error: any) {
    log(`Post generation error: ${error.message}`, "openai");
    throw error;
  }
}

export async function refinePost(
  currentContent: string,
  action: "regenerate" | "shorten" | "expand" | "professional" | "casual",
  writingStylePrompt: string
): Promise<string> {
  const actionPrompts = {
    regenerate: "Rewrite this post completely with a fresh perspective while keeping the same topic",
    shorten: "Make this post more concise while keeping the key message. Target 100-150 words.",
    expand: "Expand this post with more detail, examples, or context. Target 250-350 words.",
    professional: "Make this post more professional and formal in tone while keeping authenticity",
    casual: "Make this post more conversational and casual while keeping the key message",
  };

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn content editor. Modify the following post according to the instruction while maintaining this writing style:

${writingStylePrompt}

Important: Return ONLY the refined post content, no explanations or metadata.`
        },
        {
          role: "user",
          content: `Instruction: ${actionPrompts[action]}\n\nCurrent post:\n${currentContent}`
        }
      ],
      max_completion_tokens: 1000,
    });

    return response.choices[0].message.content || currentContent;
  } catch (error: any) {
    log(`Post refinement error: ${error.message}`, "openai");
    throw error;
  }
}

export async function extractLinkedInPosts(profileHtml: string): Promise<{
  posts: { content: string; date: string; engagement: number }[];
  comments: { content: string; date: string }[];
}> {
  // Since LinkedIn requires authentication, we'll use AI to help structure scraped data
  // In a real implementation, this would use LinkedIn's API with proper OAuth
  // For now, we'll return sample data for Jiten Madia's style
  return {
    posts: [
      {
        content: "The future of market research isn't about collecting more data.\n\nIt's about asking better questions.\n\nI've spent 15+ years in this industry, and the tools have changed dramatically. But the fundamental challenge remains:\n\nHow do we translate insights into action?\n\nHere's what I've learned: The best researchers aren't data collectors. They're storytellers who happen to use data.\n\nWhat's one insight that changed how your organization thinks?",
        date: new Date().toISOString(),
        engagement: 150,
      },
      {
        content: "AI is transforming market research.\n\nBut not in the way most people think.\n\nIt's not about replacing researchers. It's about amplifying their capabilities.\n\nI've seen teams reduce analysis time by 60% while uncovering insights they would have missed.\n\nThe secret? Knowing when to use AI and when to trust human judgment.\n\nAre you using AI in your research practice? I'd love to hear what's working.",
        date: new Date().toISOString(),
        engagement: 200,
      },
      {
        content: "Stop asking what customers want.\n\nStart observing what they do.\n\nThis single shift transformed how we approach research at our firm.\n\nBehavioral data > stated preferences\n\nEvery time.\n\nWhat's the biggest gap you've seen between what customers say and what they do?",
        date: new Date().toISOString(),
        engagement: 180,
      },
    ],
    comments: [
      {
        content: "Great point! The integration of AI with qualitative research is particularly exciting. We're seeing incredible results with hybrid approaches.",
        date: new Date().toISOString(),
      },
      {
        content: "This resonates deeply. The art of asking 'why' is often more valuable than asking 'what.'",
        date: new Date().toISOString(),
      },
    ],
  };
}
