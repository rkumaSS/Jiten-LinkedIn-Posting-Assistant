import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { SourceCard } from "@/components/source-card";
import { DraftCard } from "@/components/draft-card";
import { PublishedPostCard } from "@/components/published-post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  FileEdit, 
  Send, 
  Globe, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import type { ContentSource, GeneratedPost, ScrapedArticle } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const [refreshingSource, setRefreshingSource] = useState<string | null>(null);

  const { data: sources, isLoading: sourcesLoading } = useQuery<ContentSource[]>({
    queryKey: ["/api/sources"],
  });

  const { data: drafts, isLoading: draftsLoading } = useQuery<GeneratedPost[]>({
    queryKey: ["/api/posts", "drafts"],
  });

  const { data: published, isLoading: publishedLoading } = useQuery<GeneratedPost[]>({
    queryKey: ["/api/posts", "published"],
  });

  const { data: articles } = useQuery<ScrapedArticle[]>({
    queryKey: ["/api/articles"],
  });

  const { data: stats } = useQuery<{
    totalPosts: number;
    totalDrafts: number;
    totalSources: number;
    postsThisWeek: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const handleRefreshSource = async (sourceId: string) => {
    setRefreshingSource(sourceId);
    try {
      await apiRequest("POST", `/api/sources/${sourceId}/scrape`);
      await queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Source refreshed",
        description: "New articles have been fetched.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to scrape source. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshingSource(null);
    }
  };

  const getArticlesForSource = (sourceId: string) => {
    return articles?.filter(a => a.sourceId === sourceId).slice(0, 3).map(a => ({
      title: a.title,
      url: a.url,
    })) || [];
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Stats Section */}
      <section>
        <h1 className="text-2xl font-semibold mb-6" data-testid="text-dashboard-title">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats ? (
            <>
              <StatsCard
                title="Posts This Week"
                value={stats.postsThisWeek}
                subtitle="Keep the momentum"
                icon={Send}
                trend={{ value: 12, positive: true }}
              />
              <StatsCard
                title="Draft Posts"
                value={stats.totalDrafts}
                subtitle="Ready for review"
                icon={FileEdit}
              />
              <StatsCard
                title="Content Sources"
                value={stats.totalSources}
                subtitle="Active scrapers"
                icon={Globe}
              />
              <StatsCard
                title="Total Published"
                value={stats.totalPosts}
                subtitle="All time"
                icon={Sparkles}
              />
            </>
          ) : (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Content Sources Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Content Sources</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/scout" data-testid="link-view-all-sources">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sourcesLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : sources?.length ? (
            sources.slice(0, 3).map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                articles={getArticlesForSource(source.id)}
                onRefresh={() => handleRefreshSource(source.id)}
                isRefreshing={refreshingSource === source.id}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No content sources</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add content sources to start finding inspiration
                </p>
                <Button asChild>
                  <Link href="/settings">Add Sources</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Recent Drafts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Drafts</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/drafts" data-testid="link-view-all-drafts">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {draftsLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : drafts?.length ? (
            drafts.slice(0, 3).map((draft) => (
              <DraftCard
                key={draft.id}
                post={draft}
                article={articles?.find(a => a.id === draft.articleId)}
                onEdit={() => window.location.href = `/drafts/${draft.id}`}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No drafts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate posts from scraped content to create drafts
                </p>
                <Button asChild>
                  <Link href="/scout">Scout Content</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Published Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recently Published</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/published" data-testid="link-view-all-published">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {publishedLoading ? (
            [1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-20 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : published?.length ? (
            published.slice(0, 3).map((post) => (
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
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No published posts</h3>
                <p className="text-sm text-muted-foreground">
                  Published posts will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
