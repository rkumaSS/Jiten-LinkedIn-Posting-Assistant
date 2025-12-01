import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Send, Trash2, Clock, Sparkles, ExternalLink } from "lucide-react";
import type { GeneratedPost, ScrapedArticle } from "@shared/schema";

interface DraftCardProps {
  post: GeneratedPost;
  article?: ScrapedArticle | null;
  onEdit?: () => void;
  onPublish?: () => void;
  onDiscard?: () => void;
}

export function DraftCard({ post, article, onEdit, onPublish, onDiscard }: DraftCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Draft</Badge>;
      case "scheduled":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Scheduled</Badge>;
      case "published":
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Published</Badge>;
      case "generating":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 animate-pulse">Generating</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncateContent = (content: string, lines = 3) => {
    const splitLines = content.split("\n").filter(line => line.trim());
    if (splitLines.length <= lines) return content;
    return splitLines.slice(0, lines).join("\n") + "...";
  };

  return (
    <Card className="hover-elevate flex flex-col" data-testid={`draft-card-${post.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(post.status)}
          {post.styleMatch && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>{post.styleMatch}% style match</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(post.createdAt)}
        </span>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {truncateContent(post.content)}
        </p>
        
        {article && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wide">Source:</span>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="truncate max-w-[200px]">{article.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2 pt-3 border-t border-border">
        <Button
          variant="default"
          size="sm"
          onClick={onEdit}
          data-testid={`button-edit-${post.id}`}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onPublish}
          data-testid={`button-publish-${post.id}`}
        >
          <Send className="h-3.5 w-3.5 mr-1" />
          Publish
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="text-muted-foreground hover:text-destructive"
          data-testid={`button-discard-${post.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
