import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  RefreshCw, 
  Minus, 
  Plus, 
  MessageSquare,
  Send,
  Save,
  Clock,
  ExternalLink,
  Wand2
} from "lucide-react";
import type { GeneratedPost, ScrapedArticle } from "@shared/schema";

interface PostEditorProps {
  post: GeneratedPost;
  article?: ScrapedArticle | null;
  onSave: (content: string) => void;
  onPublish: (content: string) => void;
  onRefine: (action: "regenerate" | "shorten" | "expand" | "professional" | "casual") => Promise<string>;
  isRefining?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
}

const MAX_LINKEDIN_CHARS = 3000;

export function PostEditor({ 
  post, 
  article, 
  onSave, 
  onPublish, 
  onRefine,
  isRefining,
  isSaving,
  isPublishing
}: PostEditorProps) {
  const [content, setContent] = useState(post.content);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(post.content);
    setHasChanges(false);
  }, [post.content]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== post.content);
  };

  const handleRefine = async (action: "regenerate" | "shorten" | "expand" | "professional" | "casual") => {
    const refined = await onRefine(action);
    setContent(refined);
    setHasChanges(true);
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LINKEDIN_CHARS;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Source Panel */}
      {article && (
        <Card className="flex flex-col max-h-[calc(100vh-200px)]">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div>
              <h3 className="font-medium text-sm">Source Article</h3>
              <span className="text-xs text-muted-foreground">Original content for reference</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <CardContent className="pt-4">
              <h2 className="font-semibold text-lg mb-3">{article.title}</h2>
              {article.author && (
                <p className="text-sm text-muted-foreground mb-2">By {article.author}</p>
              )}
              {article.topics && article.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {article.topics.map((topic, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {article.content || article.summary || "No content available"}
                </p>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      )}

      {/* Editor Panel */}
      <Card className={`flex flex-col ${article ? "" : "lg:col-span-2"} max-h-[calc(100vh-200px)]`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-medium text-sm">LinkedIn Post</h3>
              <span className="text-xs text-muted-foreground">Edit and refine your post</span>
            </div>
            <div className="flex items-center gap-2">
              {post.styleMatch && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {post.styleMatch}% style match
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        
        {/* AI Refinement Toolbar */}
        <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-2">AI Refine:</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRefine("regenerate")}
            disabled={isRefining}
            data-testid="button-regenerate"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefining ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRefine("shorten")}
            disabled={isRefining}
            data-testid="button-shorten"
          >
            <Minus className="h-3.5 w-3.5 mr-1" />
            Shorten
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRefine("expand")}
            disabled={isRefining}
            data-testid="button-expand"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Expand
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRefine("professional")}
            disabled={isRefining}
            data-testid="button-professional"
          >
            <Wand2 className="h-3.5 w-3.5 mr-1" />
            Professional
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRefine("casual")}
            disabled={isRefining}
            data-testid="button-casual"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Casual
          </Button>
        </div>

        <CardContent className="flex-1 flex flex-col pt-4">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your LinkedIn post here..."
            className="flex-1 min-h-[300px] resize-none text-sm leading-relaxed"
            data-testid="textarea-post-content"
          />
          
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className={`${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {charCount.toLocaleString()} / {MAX_LINKEDIN_CHARS.toLocaleString()} characters
              {isOverLimit && " (over limit)"}
            </span>
            {hasChanges && (
              <span className="text-muted-foreground italic">Unsaved changes</span>
            )}
          </div>
        </CardContent>

        <Separator />
        <div className="p-4 flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onSave(content)}
            disabled={isSaving || !hasChanges}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            variant="outline"
            disabled
            data-testid="button-schedule"
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button
            variant="default"
            onClick={() => onPublish(content)}
            disabled={isPublishing || isOverLimit}
            className="ml-auto"
            data-testid="button-publish-now"
          >
            <Send className="h-4 w-4 mr-2" />
            {isPublishing ? "Publishing..." : "Publish Now"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
