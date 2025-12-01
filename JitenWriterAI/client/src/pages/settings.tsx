import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Linkedin, 
  Key, 
  Globe, 
  Clock, 
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import type { Settings, ProfileData, ContentSource } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ApiStatus {
  openai: boolean;
  linkedin: boolean;
  database: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);

  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const { data: sources } = useQuery<ContentSource[]>({
    queryKey: ["/api/sources"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/profile/analyze");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile analyzed",
        description: "Writing style has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeProfile = async () => {
    setIsAnalyzingProfile(true);
    try {
      await analyzeProfileMutation.mutateAsync();
    } finally {
      setIsAnalyzingProfile(false);
    }
  };

  const isLinkedInConnected = !!settings?.linkedinAccessToken;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your LinkedIn assistant
        </p>
      </div>

      {/* LinkedIn Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Linkedin className="h-5 w-5" />
            LinkedIn Connection
          </CardTitle>
          <CardDescription>
            Connect your LinkedIn account to publish posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLinkedInConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Connected</p>
                    <p className="text-xs text-muted-foreground">
                      Ready to publish posts
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Not connected</p>
                    <p className="text-xs text-muted-foreground">
                      Connect to enable publishing
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button 
              variant={isLinkedInConnected ? "outline" : "default"}
              onClick={() => window.open("/api/auth/linkedin", "_blank")}
              data-testid="button-connect-linkedin"
            >
              {isLinkedInConnected ? "Reconnect" : "Connect LinkedIn"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile & Writing Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5" />
            Profile & Writing Style
          </CardTitle>
          <CardDescription>
            Analyze Jiten's LinkedIn posts to match writing style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : profile ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.headline}</p>
                  <a 
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                  >
                    View profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAnalyzeProfile}
                  disabled={isAnalyzingProfile}
                  data-testid="button-analyze-profile"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzingProfile ? "animate-spin" : ""}`} />
                  {isAnalyzingProfile ? "Analyzing..." : "Re-analyze"}
                </Button>
              </div>
              
              {profile.writingStyleAnalysis && (
                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">Writing Style Analysis</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.writingStyleAnalysis}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Posts analyzed: {(profile.posts as any[])?.length || 0}</span>
                <span className="text-border">|</span>
                <span>Comments analyzed: {(profile.comments as any[])?.length || 0}</span>
                <span className="text-border">|</span>
                <span>Last updated: {new Date(profile.lastUpdatedAt).toLocaleDateString()}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Profile not yet analyzed
              </p>
              <Button onClick={handleAnalyzeProfile} disabled={isAnalyzingProfile}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzingProfile ? "animate-spin" : ""}`} />
                Analyze Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5" />
            Content Sources
          </CardTitle>
          <CardDescription>
            Websites scraped for content inspiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources?.map((source) => (
              <div 
                key={source.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${source.isActive ? "bg-status-online" : "bg-status-offline"}`} />
                  <div>
                    <p className="text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.url}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {source.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posting Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Posting Preferences
          </CardTitle>
          <CardDescription>
            Configure automatic posting behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Posting Frequency</Label>
                <Select
                  value={settings?.postingFrequency || "daily"}
                  onValueChange={(value) => updateSettingsMutation.mutate({ postingFrequency: value })}
                >
                  <SelectTrigger id="frequency" data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Once daily</SelectItem>
                    <SelectItem value="twice_daily">Twice daily</SelectItem>
                    <SelectItem value="weekly">Once weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings?.timezone || "America/New_York"}
                  onValueChange={(value) => updateSettingsMutation.mutate({ timezone: value })}
                >
                  <SelectTrigger id="timezone" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-publish">Auto-publish</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically publish scheduled posts
                  </p>
                </div>
                <Switch
                  id="auto-publish"
                  checked={settings?.autoPublish || false}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ autoPublish: checked })}
                  data-testid="switch-auto-publish"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            API keys are configured via environment variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {apiStatus?.openai ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <div>
                  <span className="text-sm">OpenAI API</span>
                  {!apiStatus?.openai && (
                    <p className="text-xs text-muted-foreground">
                      Required for AI features. Add OPENAI_API_KEY to environment.
                    </p>
                  )}
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs ${apiStatus?.openai 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
              >
                {apiStatus?.openai ? "Configured" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {isLinkedInConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">LinkedIn API</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {isLinkedInConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
