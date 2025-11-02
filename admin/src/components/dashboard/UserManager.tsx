import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Shield,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Crown,
  User,
  Eye,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const users = [
  {
    id: 1,
    name: "John Smith",
    email: "john@sportsblog.com",
    role: "Super Admin",
    status: "active",
    lastLogin: "2024-01-15",
    postsCount: 45,
    avatar: "/api/placeholder/40/40",
    joinDate: "2023-06-15"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@sportsblog.com", 
    role: "Editor",
    status: "active",
    lastLogin: "2024-01-14",
    postsCount: 32,
    avatar: "/api/placeholder/40/40",
    joinDate: "2023-08-20"
  },
  {
    id: 3,
    name: "Mike Davis",
    email: "mike@sportsblog.com",
    role: "Author",
    status: "active",
    lastLogin: "2024-01-13",
    postsCount: 28,
    avatar: "/api/placeholder/40/40",
    joinDate: "2023-09-10"
  },
  {
    id: 4,
    name: "Emma Wilson",
    email: "emma@sportsblog.com",
    role: "Author",
    status: "inactive",
    lastLogin: "2024-01-05",
    postsCount: 15,
    avatar: "/api/placeholder/40/40",
    joinDate: "2023-11-02"
  },
  {
    id: 5,
    name: "David Brown", 
    email: "david@sportsblog.com",
    role: "Viewer",
    status: "active",
    lastLogin: "2024-01-12",
    postsCount: 0,
    avatar: "/api/placeholder/40/40",
    joinDate: "2024-01-01"
  }
];

const roles = ["All", "Super Admin", "Editor", "Author", "Viewer"];
const statuses = ["All", "Active", "Inactive"];

const rolePermissions = {
  "Super Admin": {
    color: "bg-destructive/20 text-destructive",
    icon: Crown,
    permissions: ["Full Access", "User Management", "System Settings"]
  },
  "Editor": {
    color: "bg-primary/20 text-primary", 
    icon: Shield,
    permissions: ["Publish Posts", "Edit All Content", "Moderate Comments"]
  },
  "Author": {
    color: "bg-success/20 text-success",
    icon: Edit,
    permissions: ["Create Posts", "Edit Own Posts", "Upload Media"]
  },
  "Viewer": {
    color: "bg-muted/20 text-muted-foreground",
    icon: Eye,
    permissions: ["View Analytics", "Read Comments"]
  }
};

export function UserManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-success/20 text-success" 
      : "bg-muted/20 text-muted-foreground";
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "All" || user.status === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.role === "Super Admin").length,
    authors: users.filter(u => u.role === "Author").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Team</p>
                <p className="text-2xl font-bold text-foreground">{userStats.total}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-success">{userStats.active}</p>
              </div>
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-destructive">{userStats.admins}</p>
              </div>
              <Crown className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Authors</p>
                <p className="text-2xl font-bold text-warning">{userStats.authors}</p>
              </div>
              <Edit className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/20 border-border"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-[180px] bg-muted/20 border-border">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px] bg-muted/20 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleConfig = rolePermissions[user.role as keyof typeof rolePermissions];
                const RoleIcon = roleConfig.icon;
                
                return (
                  <TableRow key={user.id} className="hover:bg-muted/10">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-foreground">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={roleConfig.color}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{user.postsCount}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.joinDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Ban className="mr-2 h-4 w-4" />
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Permissions Guide */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(rolePermissions).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <div key={role} className="p-4 bg-muted/10 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Icon className="w-5 h-5 text-foreground" />
                    <h4 className="font-medium text-foreground">{role}</h4>
                  </div>
                  <ul className="space-y-1">
                    {config.permissions.map((permission, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}