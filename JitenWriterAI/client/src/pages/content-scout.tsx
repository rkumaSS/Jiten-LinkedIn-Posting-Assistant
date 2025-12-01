import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArticleCard } from "@/components/article-card";
import { SourceCard } from "@/components/source-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  RefreshCw, 
  Sparkles, 
  Filter,
  Globe,
  CheckSquare
} from "lucide-react";
import type { ContentSource, ScrapedArticle } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ContentScout() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [generatingArticle, setGeneratingArticle] = useState<string | null>(null);
  const [refreshingSource, setRefreshingSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("articles");

  const { data: sources, isLoading: sourcesLoading } = useQuery<ContentSource[]>({
    queryKey: ["/api/sources"],
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<ScrapedArticle[]>({
    queryKey: ["/api/articles"],
  });

  const generatePostMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const res = await apiRequest("POST", "/api/posts/generate", { articleId });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to generate post");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Post generated",
        description: "Your draft is ready for review.",
      });
      navigate(`/drafts/${data.id}`);
    },
    onError: (error: Error) => {
      const isApiKeyMissing = error.message.includes("OpenAI API key");
      toast({
        title: isApiKeyMissing ? "API Key Required" : "Generation failed",
        description: isApiKeyMissing 
          ? "Please configure your OpenAI API key in Settings to use AI features."
          : error.message || "Failed to generate post. Please try again.",
        variant: "destructive",
      });
    },
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

  const handleRefreshAll = async () => {
    toast({
      title: "Refreshing all sources",
      description: "This may take a minute...",
    });
    try {
      await apiRequest("POST", "/api/sources/scrape-all");
      await queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "All sources refreshed",
        description: "New articles have been fetched from all sources.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Some sources may have failed. Check individual sources.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePost = async (articleId: string) => {
    setGeneratingArticle(articleId);
    try {
      await generatePostMutation.mutateAsync(articleId);
    } finally {
      setGeneratingArticle(null);
    }
  };

  const handleSelectArticle = (articleId: string, selected: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (selected) {
      newSelected.add(articleId);
    } else {
      newSelected.delete(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const handleBatchGenerate = async () => {
    if (selectedArticles.size === 0) return;
    toast({
      title: "Generating posts",
      description: `Creating ${selectedArticles.size} posts...`,
    });
    for (const articleId of selectedArticles) {
      try {
        await generatePostMutation.mutateAsync(articleId);
      } catch (error) {
        // Continue with next article
      }
    }
    setSelectedArticles(new Set());
  };

  const getSourceName = (sourceId: string) => {
    return sources?.find(s => s.id === sourceId)?.name || "Unknown";
  };

  const filteredArticles = articles?.filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.summary?.toLowerCase().includes(query) ||
      article.topics?.some(t => t.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    // Sort by relevance score, then by scraped date
    if (b.relevanceScore && a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-scout-title">Content Scout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover trending topics and generate posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedArticles.size > 0 && (
            <Button 
              onClick={handleBatchGenerate}
              disabled={generatePostMutation.isPending}
              data-testid="button-batch-generate"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {selectedArticles.size} Posts
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleRefreshAll}
            data-testid="button-refresh-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="articles" data-testid="tab-articles">
              <Globe className="h-4 w-4 mr-2" />
              Articles
              {articles?.length ? (
                <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                  {articles.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="sources" data-testid="tab-sources">
              Sources
              {sources?.length ? (
                <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                  {sources.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {activeTab === "articles" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[300px]"
                data-testid="input-search-articles"
              />
            </div>
          )}
        </div>

        <TabsContent value="articles" className="mt-6">
          {articlesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredArticles?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  sourceName={getSourceName(article.sourceId)}
                  isSelected={selectedArticles.has(article.id)}
                  onSelect={(selected) => handleSelectArticle(article.id, selected)}
                  onGeneratePost={() => handleGeneratePost(article.id)}
                  isGenerating={generatingArticle === article.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No articles found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {searchQuery 
                    ? "Try adjusting your search terms"
                    : "Refresh your content sources to fetch new articles"}
                </p>
                {!searchQuery && (
                  <Button onClick={handleRefreshAll}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Sources
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          {sourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sources?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  articles={articles?.filter(a => a.sourceId === source.id).slice(0, 3).map(a => ({
                    title: a.title,
                    url: a.url,
                  }))}
                  onRefresh={() => handleRefreshSource(source.id)}
                  isRefreshing={refreshingSource === source.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No sources configured</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Content sources are automatically configured. Check settings to manage them.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
