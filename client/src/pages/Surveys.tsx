import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Clock, Zap, Filter, Search } from "lucide-react";

export default function Surveys() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: surveys, isLoading } = trpc.survey.list.useQuery({ limit: 20, offset: 0 });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Zap className="w-8 h-8 text-accent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to view and complete surveys.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const filteredSurveys =
    surveys?.filter((survey) => {
      const matchesSearch =
        survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        survey.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || survey.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  const categories = Array.from(
    new Set(surveys?.map((s) => s.category).filter(Boolean) as string[])
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-4">Available Surveys</h1>
          <p className="text-muted-foreground">
            Browse and complete surveys to earn points. Every survey completed brings you closer to
            your rewards.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h2>

              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search surveys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium mb-3 block">Category</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === null
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>{filteredSurveys.length}</strong> surveys available
                </p>
              </div>
            </Card>
          </div>

          {/* Survey Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </Card>
                ))}
              </div>
            ) : filteredSurveys.length === 0 ? (
              <Card className="p-12 text-center">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No surveys found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters. New surveys are added regularly.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSurveys.map((survey) => (
                  <SurveyCard key={survey.id} survey={survey} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveyCard({
  survey,
}: {
  survey: {
    id: number;
    title: string;
    description: string | null;
    pointsReward: number;
    estimatedDurationMinutes: number | null;
    category: string | null;
    completedCount: number;
    quota: number | null;
  };
}) {
  const progressPercent =
    survey.quota && survey.quota > 0 ? (survey.completedCount / survey.quota) * 100 : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{survey.title}</h3>
          {survey.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{survey.description}</p>
          )}
        </div>
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-accent">{survey.pointsReward}</div>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {survey.estimatedDurationMinutes && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {survey.estimatedDurationMinutes} min
          </div>
        )}
        {survey.category && (
          <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
            {survey.category}
          </span>
        )}
      </div>

      {survey.quota && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Responses</span>
            <span>
              {survey.completedCount}/{survey.quota}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      <Link href={`/survey/${survey.id}`}>
        <Button className="w-full">Start Survey</Button>
      </Link>
    </Card>
  );
}
