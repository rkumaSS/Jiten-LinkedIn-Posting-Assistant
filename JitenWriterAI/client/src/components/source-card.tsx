import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Clock, FileText } from "lucide-react";
import type { ContentSource } from "@shared/schema";

interface SourceCardProps {
  source: ContentSource;
  articles?: { title: string; url: string }[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function SourceCard({ source, articles = [], onRefresh, isRefreshing }: SourceCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "research": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "tech": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "business": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "marketing": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="hover-elevate" data-testid={`source-card-${source.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{source.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${getCategoryColor(source.category)}`}>
                {source.category}
              </Badge>
              {source.isActive && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-online" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          data-testid={`button-refresh-${source.id}`}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(source.lastScrapedAt)}
          </span>
          <span>{source.articleCount} articles</span>
        </div>
        
        {articles.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {articles.slice(0, 3).map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-sm hover:text-primary transition-colors"
                data-testid={`article-link-${idx}`}
              >
                <ExternalLink className="h-3 w-3 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="line-clamp-1">{article.title}</span>
              </a>
            ))}
          </div>
        )}
        
        <Button
          variant="link"
          className="px-0 h-auto mt-2 text-xs"
          asChild
        >
          <a href={source.url} target="_blank" rel="noopener noreferrer" data-testid={`link-source-${source.id}`}>
            View all articles
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
