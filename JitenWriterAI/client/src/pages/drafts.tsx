import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { DraftCard } from "@/components/draft-card";
import { PostEditor } from "@/components/post-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileEdit, 
  ArrowLeft,
  Sparkles,
  Clock,
  Trash2
} from "lucide-react";
import type { GeneratedPost, ScrapedArticle } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Drafts() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/drafts/:id");
  const [activeTab, setActiveTab] = useState("all");

  const { data: posts, isLoading } = useQuery<GeneratedPost[]>({
    queryKey: ["/api/posts", "drafts"],
  });

  const { data: articles } = useQuery<ScrapedArticle[]>({
    queryKey: ["/api/articles"],
  });

  const { data: selectedPost, isLoading: postLoading } = useQuery<GeneratedPost>({
    queryKey: ["/api/posts", params?.id],
    enabled: !!params?.id,
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/posts/${id}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Draft saved",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${id}/publish`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post published",
        description: "Your post has been published to LinkedIn.",
      });
      navigate("/published");
    },
    onError: () => {
      toast({
        title: "Publish failed",
        description: "Failed to publish. Check your LinkedIn connection.",
        variant: "destructive",
      });
    },
  });

  const discardPostMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Draft discarded",
        description: "The draft has been removed.",
      });
      if (match) {
        navigate("/drafts");
      }
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to discard draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  const refinePostMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await apiRequest("POST", `/api/posts/${id}/refine`, { action });
      return res.json();
    },
    onError: () => {
      toast({
        title: "Refinement failed",
        description: "Failed to refine post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefine = async (action: "regenerate" | "shorten" | "expand" | "professional" | "casual") => {
    if (!selectedPost) return "";
    const result = await refinePostMutation.mutateAsync({ 
      id: selectedPost.id, 
      action 
    });
    return result.content;
  };

  const getArticle = (articleId: string | null) => {
    if (!articleId) return null;
    return articles?.find(a => a.id === articleId);
  };

  const filteredPosts = posts?.filter(post => {
    if (activeTab === "all") return true;
    if (activeTab === "scheduled") return post.status === "scheduled";
    return true;
  });

  // Show editor view when a specific draft is selected
  if (match && selectedPost) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/drafts")}
            data-testid="button-back-to-drafts"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drafts
          </Button>
          <h1 className="text-xl font-semibold">Edit Draft</h1>
        </div>
        
        <PostEditor
          post={selectedPost}
          article={getArticle(selectedPost.articleId)}
          onSave={(content) => updatePostMutation.mutate({ id: selectedPost.id, content })}
          onPublish={(content) => publishPostMutation.mutate({ id: selectedPost.id, content })}
          onRefine={handleRefine}
          isRefining={refinePostMutation.isPending}
          isSaving={updatePostMutation.isPending}
          isPublishing={publishPostMutation.isPending}
        />
      </div>
    );
  }

  // Loading state for editor
  if (match && postLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Drafts
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-drafts-title">AI Drafts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and edit your generated posts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-drafts">
            All Drafts
            {posts?.filter(p => p.status === "draft").length ? (
              <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                {posts.filter(p => p.status === "draft").length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled
            {posts?.filter(p => p.status === "scheduled").length ? (
              <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                {posts.filter(p => p.status === "scheduled").length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-20 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts?.filter(p => p.status === "draft").length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.filter(p => p.status === "draft").map((post) => (
                <DraftCard
                  key={post.id}
                  post={post}
                  article={getArticle(post.articleId)}
                  onEdit={() => navigate(`/drafts/${post.id}`)}
                  onPublish={() => publishPostMutation.mutate({ id: post.id, content: post.content })}
                  onDiscard={() => discardPostMutation.mutate(post.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileEdit className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No drafts yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Generate posts from your content sources to create drafts
                </p>
                <Button onClick={() => navigate("/scout")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Scout Content
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-20 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts?.filter(p => p.status === "scheduled").length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.filter(p => p.status === "scheduled").map((post) => (
                <DraftCard
                  key={post.id}
                  post={post}
                  article={getArticle(post.articleId)}
                  onEdit={() => navigate(`/drafts/${post.id}`)}
                  onPublish={() => publishPostMutation.mutate({ id: post.id, content: post.content })}
                  onDiscard={() => discardPostMutation.mutate(post.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No scheduled posts</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Schedule posts from your drafts to publish later
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
