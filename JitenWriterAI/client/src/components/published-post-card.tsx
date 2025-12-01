import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ThumbsUp, MessageCircle, Repeat2, Eye } from "lucide-react";
import type { GeneratedPost } from "@shared/schema";

interface PublishedPostCardProps {
  post: GeneratedPost;
  engagement?: {
    likes: number;
    comments: number;
    reposts: number;
    views: number;
  };
}

export function PublishedPostCard({ post, engagement }: PublishedPostCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncateContent = (content: string, chars = 200) => {
    if (content.length <= chars) return content;
    return content.slice(0, chars).trim() + "...";
  };

  return (
    <Card className="hover-elevate" data-testid={`published-card-${post.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Published
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(post.publishedAt)}
          </span>
        </div>
        
        <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">
          {truncateContent(post.content)}
        </p>

        {engagement && (
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <span>{engagement.likes}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{engagement.comments}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Repeat2 className="h-4 w-4" />
              <span>{engagement.reposts}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{engagement.views}</span>
            </div>
            {post.linkedinPostId && (
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a 
                  href={`https://www.linkedin.com/feed/update/${post.linkedinPostId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  View on LinkedIn
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
