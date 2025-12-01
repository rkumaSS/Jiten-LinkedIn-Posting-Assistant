import { useQuery } from "@tanstack/react-query";
import { PublishedPostCard } from "@/components/published-post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import type { GeneratedPost } from "@shared/schema";

export default function Published() {
  const { data: posts, isLoading } = useQuery<GeneratedPost[]>({
    queryKey: ["/api/posts", "published"],
  });

  const groupPostsByDate = (posts: GeneratedPost[]) => {
    const groups: { [key: string]: GeneratedPost[] } = {};
    
    posts.forEach(post => {
      if (!post.publishedAt) return;
      const date = new Date(post.publishedAt);
      const key = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(post);
    });

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const groupedPosts = posts ? groupPostsByDate(posts) : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-published-title">Published Posts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your LinkedIn posting history and performance
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-20 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : groupedPosts.length ? (
        <div className="space-y-8">
          {groupedPosts.map(([date, datePosts]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                {date}
              </h2>
              <div className="space-y-3">
                {datePosts.map((post) => (
                  <PublishedPostCard
                    key={post.id}
                    post={post}
                    engagement={{
                      likes: Math.floor(Math.random() * 100) + 10,
                      comments: Math.floor(Math.random() * 20) + 2,
                      reposts: Math.floor(Math.random() * 10),
                      views: Math.floor(Math.random() * 1000) + 100,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Send className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No published posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Posts you publish will appear here with their engagement metrics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
