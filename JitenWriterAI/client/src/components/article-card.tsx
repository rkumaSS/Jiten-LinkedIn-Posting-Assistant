import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Sparkles, Calendar, BarChart3 } from "lucide-react";
import type { ScrapedArticle } from "@shared/schema";

interface ArticleCardProps {
  article: ScrapedArticle;
  sourceName?: string;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onGeneratePost?: () => void;
  isGenerating?: boolean;
}

export function ArticleCard({ 
  article, 
  sourceName,
  isSelected, 
  onSelect, 
  onGeneratePost,
  isGenerating 
}: ArticleCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRelevanceColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <Card 
      className={`hover-elevate flex flex-col transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
      data-testid={`article-card-${article.id}`}
    >
      <CardHeader className="flex flex-row items-start gap-3 pb-2">
        {onSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
            data-testid={`checkbox-article-${article.id}`}
          />
        )}
        <div className="flex-1 min-w-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
          </a>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {sourceName && (
              <Badge variant="outline" className="text-xs">
                {sourceName}
              </Badge>
            )}
            {article.relevanceScore && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getRelevanceColor(article.relevanceScore)}`}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                {article.relevanceScore}% relevant
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>
        )}
        
        {article.topics && article.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {article.topics.slice(0, 4).map((topic, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs bg-muted"
              >
                {topic}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {article.author && <span>By {article.author}</span>}
          {article.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.publishedAt)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-3 border-t border-border">
        <Button
          variant="default"
          size="sm"
          onClick={onGeneratePost}
          disabled={isGenerating || article.isUsed}
          className="flex-1"
          data-testid={`button-generate-${article.id}`}
        >
          <Sparkles className={`h-3.5 w-3.5 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
          {article.isUsed ? "Used" : isGenerating ? "Generating..." : "Generate Post"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
