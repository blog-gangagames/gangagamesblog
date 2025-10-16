import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Database,
  Trash2,
  Save
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true
  });

  const [siteSettings, setSiteSettings] = useState({
    siteName: "GangaGames",
    siteDescription: "Premium betting news, guides, and analysis",
    timezone: "UTC-5",
    language: "en"
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your blog settings and preferences.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation */}
        <div className="space-y-2">
          {[
            { id: "general", label: "General", icon: SettingsIcon },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "advanced", label: "Advanced", icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start"
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                    className="bg-muted/20 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={siteSettings.timezone} onValueChange={(value) => setSiteSettings({...siteSettings, timezone: value})}>
                    <SelectTrigger className="bg-muted/20 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                      <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="UTC+0">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({...siteSettings, siteDescription: e.target.value})}
                  className="bg-muted/20 border-border min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailAlerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                </div>
                <Switch
                  id="emailAlerts"
                  checked={notifications.emailAlerts}
                  onCheckedChange={(checked) => setNotifications({...notifications, emailAlerts: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Automated weekly performance reports</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="securityAlerts">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alerts for security-related events</p>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={notifications.securityAlerts}
                  onCheckedChange={(checked) => setNotifications({...notifications, securityAlerts: checked})}
                />
              </div>
            </CardContent>
          </Card>

          

          

          

          {/* Danger Zone */}
          <Card className="bg-gradient-card border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <Trash2 className="w-5 h-5 mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}