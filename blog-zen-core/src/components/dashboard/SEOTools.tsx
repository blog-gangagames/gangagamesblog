import { 
  Search, 
  TrendingUp, 
  Target, 
  Link,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const seoOverview = {
  score: 85,
  issues: 3,
  keywords: 247,
  backlinks: 1820,
  organicTraffic: "1.2M",
  avgPosition: 12.3
};

const keywordRankings = [
  {
    keyword: "champions league betting",
    position: 3,
    change: 2,
    searchVolume: "12.5K",
    difficulty: "High",
    traffic: "2.1K"
  },
  {
    keyword: "nfl power rankings", 
    position: 7,
    change: -1,
    searchVolume: "8.9K",
    difficulty: "Medium",
    traffic: "1.4K"
  },
  {
    keyword: "tennis betting guide",
    position: 5,
    change: 3,
    searchVolume: "6.2K", 
    difficulty: "Medium",
    traffic: "1.1K"
  },
  {
    keyword: "nba championship odds",
    position: 12,
    change: 0,
    searchVolume: "4.8K",
    difficulty: "Low",
    traffic: "850"
  }
];

const seoIssues = [
  {
    type: "Critical",
    title: "Missing Meta Descriptions",
    count: 5,
    impact: "High",
    description: "5 pages are missing meta descriptions"
  },
  {
    type: "Warning", 
    title: "Slow Loading Pages",
    count: 12,
    impact: "Medium",
    description: "12 pages have loading times > 3 seconds"
  },
  {
    type: "Info",
    title: "Missing Alt Tags",
    count: 23,
    impact: "Low", 
    description: "23 images missing descriptive alt tags"
  }
];

const topPages = [
  {
    url: "/champions-league-betting-guide",
    clicks: "15.2K",
    impressions: "125K",
    ctr: "12.2%",
    position: 3.2,
    keywords: 23
  },
  {
    url: "/nfl-power-rankings-week-10",
    clicks: "8.7K", 
    impressions: "98K",
    ctr: "8.9%",
    position: 5.1,
    keywords: 18
  },
  {
    url: "/tennis-betting-strategies",
    clicks: "6.1K",
    impressions: "76K", 
    ctr: "8.0%",
    position: 4.8,
    keywords: 15
  }
];

const backlinks = [
  {
    domain: "espn.com",
    authority: 95,
    links: 3,
    type: "dofollow",
    anchor: "sports betting analysis"
  },
  {
    domain: "bleacherreport.com", 
    authority: 88,
    links: 2,
    type: "dofollow",
    anchor: "championship predictions"
  },
  {
    domain: "sports.yahoo.com",
    authority: 92,
    links: 1,
    type: "dofollow", 
    anchor: "nfl rankings"
  }
];

export function SEOTools() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "High": return "bg-destructive/20 text-destructive";
      case "Medium": return "bg-warning/20 text-warning";
      case "Low": return "bg-success/20 text-success";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case "Critical": return "bg-destructive/20 text-destructive";
      case "Warning": return "bg-warning/20 text-warning";
      case "Info": return "bg-info/20 text-info";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SEO Tools & Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your search performance and optimize for better rankings.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Keyword Research
          </Button>
          <Button className="bg-gradient-primary shadow-primary">
            <Zap className="w-4 h-4 mr-2" />
            SEO Audit
          </Button>
        </div>
      </div>

      {/* SEO Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="text-2xl font-bold text-primary">{seoOverview.score}</div>
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">SEO Score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{seoOverview.issues}</div>
              <p className="text-sm font-medium text-muted-foreground">Issues</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{seoOverview.keywords}</div>
              <p className="text-sm font-medium text-muted-foreground">Keywords</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{seoOverview.backlinks}</div>
              <p className="text-sm font-medium text-muted-foreground">Backlinks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{seoOverview.organicTraffic}</div>
              <p className="text-sm font-medium text-muted-foreground">Organic Traffic</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{seoOverview.avgPosition}</div>
              <p className="text-sm font-medium text-muted-foreground">Avg Position</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keyword Rankings */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Keywords
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keywordRankings.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">{keyword.keyword}</h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Search className="w-3 h-3 mr-1" />
                        {keyword.searchVolume}
                      </span>
                      <Badge className={getDifficultyColor(keyword.difficulty)} variant="outline">
                        {keyword.difficulty}
                      </Badge>
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {keyword.traffic}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-primary">#{keyword.position}</span>
                      {keyword.change > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      ) : keyword.change < 0 ? (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      ) : (
                        <div className="w-4 h-4"></div>
                      )}
                    </div>
                    {keyword.change !== 0 && (
                      <span className={`text-xs ${keyword.change > 0 ? 'text-success' : 'text-destructive'}`}>
                        {keyword.change > 0 ? '+' : ''}{keyword.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO Issues */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>SEO Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seoIssues.map((issue, index) => {
                const Icon = issue.type === "Critical" ? AlertTriangle : 
                           issue.type === "Warning" ? Clock : Lightbulb;
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/10 rounded-lg">
                    <div className={`p-2 rounded-lg ${getIssueColor(issue.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground text-sm">{issue.title}</h4>
                        <Badge className={getIssueColor(issue.type)} variant="outline">
                          {issue.count}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {issue.impact} Impact
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Full SEO Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Performance */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Top Performing Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Avg Position</TableHead>
                <TableHead>Keywords</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPages.map((page, index) => (
                <TableRow key={index} className="hover:bg-muted/10">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground text-sm">{page.url}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-primary">{page.clicks}</TableCell>
                  <TableCell className="text-muted-foreground">{page.impressions}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-success">{page.ctr}</span>
                      <div className="w-12 h-1 bg-muted rounded-full">
                        <div 
                          className="h-1 bg-success rounded-full"
                          style={{ width: `${parseFloat(page.ctr)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-warning">{page.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{page.keywords}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Backlinks Analysis */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top Backlinks
            <Button variant="ghost" size="sm">View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backlinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Link className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">{link.domain}</h4>
                      <p className="text-sm text-muted-foreground">"{link.anchor}"</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-primary">DA {link.authority}</div>
                    <div className="text-xs text-muted-foreground">Authority</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-success">{link.links}</div>
                    <div className="text-xs text-muted-foreground">Links</div>
                  </div>
                  <Badge className="bg-success/20 text-success">
                    {link.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}