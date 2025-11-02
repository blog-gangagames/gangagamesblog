import { 
  FileText, 
  Edit, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Star,
  PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const authorStats = [
  {
    title: "My Articles",
    value: "24",
    change: "+3",
    trend: "up",
    icon: FileText,
    color: "text-primary",
    gradient: "bg-gradient-primary",
    shadow: "shadow-primary"
  },
  {
    title: "Published",
    value: "18",
    change: "+2",
    trend: "up",
    icon: CheckCircle,
    color: "text-success",
    gradient: "bg-gradient-success",
    shadow: "shadow-success"
  },
  {
    title: "In Review",
    value: "4",
    change: "+1",
    trend: "up",
    icon: Clock,
    color: "text-warning",
    gradient: "bg-gradient-warning",
    shadow: "shadow-warning"
  },
  {
    title: "Drafts",
    value: "2",
    change: "0",
    trend: "neutral",
    icon: Edit,
    color: "text-accent",
    gradient: "bg-gradient-accent",
    shadow: "shadow-accent"
  }
];

const recentArticles = [
  {
    title: "Premier League Match Predictions Week 15",
    status: "published",
    views: "8.2K",
    comments: 34,
    date: "2 days ago",
    engagement: 85
  },
  {
    title: "NBA Fantasy Basketball Weekly Picks",
    status: "review",
    views: "0",
    comments: 0,
    date: "1 day ago",
    engagement: 0
  },
  {
    title: "Champions League Betting Analysis",
    status: "draft",
    views: "0",
    comments: 0,
    date: "3 hours ago",
    engagement: 0
  }
];

const writingGoals = [
  { label: "Weekly Articles", current: 3, target: 4, percentage: 75 },
  { label: "Monthly Views", current: 45000, target: 50000, percentage: 90 },
  { label: "Engagement Rate", current: 78, target: 80, percentage: 97.5 }
];

export function AuthorDashboard() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-gradient-success">Published</Badge>;
      case "review":
        return <Badge className="bg-gradient-warning">In Review</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Author Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your writing progress and manage your content.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-primary">
          <PlusCircle className="w-4 h-4 mr-2" />
          Write New Article
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {authorStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gradient-card border-border hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    {stat.trend !== "neutral" && (
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 text-success mr-1" />
                        <span className="text-sm text-success">
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.gradient} ${stat.shadow}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <Card className="lg:col-span-2 bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              My Recent Articles
              <Button variant="ghost" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentArticles.map((article, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-foreground">{article.title}</h4>
                      {getStatusBadge(article.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {article.views}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {article.comments}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {article.date}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {article.status === "published" && (
                      <div className="text-sm text-muted-foreground">
                        Engagement: {article.engagement}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Writing Goals & Quick Actions */}
        <div className="space-y-6">
          {/* Writing Goals */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Writing Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {writingGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{goal.label}</span>
                      <span className="text-muted-foreground">
                        {typeof goal.current === 'number' && goal.current > 1000 
                          ? `${(goal.current / 1000).toFixed(1)}K` 
                          : goal.current}
                        {goal.label.includes('Rate') ? '%' : ''} / 
                        {typeof goal.target === 'number' && goal.target > 1000 
                          ? `${(goal.target / 1000).toFixed(1)}K` 
                          : goal.target}
                        {goal.label.includes('Rate') ? '%' : ''}
                      </span>
                    </div>
                    <Progress value={goal.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Writing Tips */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Writing Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Star className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-primary mb-2">Boost Engagement</h4>
                    <p className="text-sm text-muted-foreground">
                      Articles with data-driven insights get 40% more engagement. 
                      Include statistics and trends in your sports analysis.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}