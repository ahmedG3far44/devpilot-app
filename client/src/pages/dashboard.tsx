import { useState, useMemo } from 'react';
import { Users, Rocket, Activity, Search, Filter, UserCheck, UserX, Mail, FolderGit2, Settings, Bell, Lock, Palette, Globe, LucideHome, LucideLogOut } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth/AuthContext';

type UserRole = 'admin' | 'developer' | 'viewer';
type UserStatus = 'active' | 'blocked';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  repos: number;
  deployedProjects: number;
  joinedDate: string;
}

type Page = 'dashboard' | 'insights' | 'users' | 'settings';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState<Page>('insights');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Mock users data
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'john_doe', email: 'john@example.com', role: 'admin', status: 'active', repos: 15, deployedProjects: 8, joinedDate: '2024-01-15' },
    { id: '2', username: 'sarah_smith', email: 'sarah@example.com', role: 'developer', status: 'active', repos: 23, deployedProjects: 12, joinedDate: '2024-02-20' },
    { id: '3', username: 'mike_johnson', email: 'mike@example.com', role: 'developer', status: 'active', repos: 18, deployedProjects: 9, joinedDate: '2024-03-10' },
    { id: '4', username: 'emma_wilson', email: 'emma@example.com', role: 'viewer', status: 'active', repos: 5, deployedProjects: 2, joinedDate: '2024-04-05' },
    { id: '5', username: 'alex_brown', email: 'alex@example.com', role: 'developer', status: 'blocked', repos: 12, deployedProjects: 6, joinedDate: '2024-01-25' },
    { id: '6', username: 'lisa_taylor', email: 'lisa@example.com', role: 'developer', status: 'active', repos: 20, deployedProjects: 11, joinedDate: '2024-02-15' },
  ]);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    deploymentAlerts: true,
    securityAlerts: true,
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: true,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalRepos = users.reduce((acc, u) => acc + u.repos, 0);
    const totalDeployments = users.reduce((acc, u) => acc + u.deployedProjects, 0);
    const blockedUsers = users.filter(u => u.status === 'blocked').length;

    return {
      totalUsers: users.length,
      activeUsers,
      totalRepos,
      totalDeployments,
      blockedUsers,
      avgReposPerUser: (totalRepos / users.length).toFixed(1),
    };
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'blocked' : 'active' }
        : user
    ));
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'developer': return 'bg-blue-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500';
  };

  // Insights Page
  const InsightsPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Insights</h1>
        <p className="text-foreground mt-1">Overview of your platform metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} active, {metrics.blockedUsers} blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRepos}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgReposPerUser} avg per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed Projects</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDeployments}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDeployments}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
            <CardDescription>Breakdown of users by their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['admin', 'developer', 'viewer'].map(role => {
                const count = users.filter(u => u.role === role).length;
                const percentage = ((count / users.length) * 100).toFixed(0);
                return (
                  <div key={role} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{role}</span>
                      <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getRoleBadgeColor(role as UserRole)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New deployment by sarah_smith</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registered: emma_wilson</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Repository created by mike_johnson</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">User blocked: alex_brown</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Manage Users Page
  const ManageUsersPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Manage Users</h1>
        <p className="text-primary mt-1">View and manage all platform users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-card  transition-colors"
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-primary font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-primary">{user.username}</h3>
                      <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                        {user.role}
                      </Badge>
                      <Badge className={`${getStatusBadgeColor(user.status)} text-white`}>
                        {user.status}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FolderGit2 className="h-4 w-4 mr-1" />
                        <span>{user.repos} repos</span>
                      </div>
                      <div className="flex items-center">
                        <Rocket className="h-4 w-4 mr-1" />
                        <span>{user.deployedProjects} deployed</span>
                      </div>
                      <span className="text-gray-400">Joined {user.joinedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <Button
                    variant={user.status === 'active' ? 'destructive' : 'default'}
                    size="sm"

                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.status === 'active' ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Block
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Settings Page
  const SettingsPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email updates</p>
              </div>
              <Switch
                id="email-notif"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deploy-alerts">Deployment Alerts</Label>
                <p className="text-sm text-gray-500">Get notified of deployments</p>
              </div>
              <Switch
                id="deploy-alerts"
                checked={settings.deploymentAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, deploymentAlerts: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-alerts">Security Alerts</Label>
                <p className="text-sm text-gray-500">Important security notifications</p>
              </div>
              <Switch
                id="security-alerts"
                checked={settings.securityAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, securityAlerts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Security & Access
            </CardTitle>
            <CardDescription>Control platform access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-signups">Allow New Signups</Label>
                <p className="text-sm text-gray-500">Enable user registration</p>
              </div>
              <Switch
                id="allow-signups"
                checked={settings.allowSignups}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowSignups: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-verify">Email Verification</Label>
                <p className="text-sm text-gray-500">Require email verification</p>
              </div>
              <Switch
                id="email-verify"
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireEmailVerification: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Disable public access</p>
              </div>
              <Switch
                id="maintenance"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Platform Information
            </CardTitle>
            <CardDescription>General platform details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input id="platform-name" defaultValue="Admin Dashboard" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="platform-url">Platform URL</Label>
              <Input id="platform-url" defaultValue="https://dashboard.example.com" className="mt-1" />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the dashboard look</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="light">
                <SelectTrigger id="theme" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input type="color" id="primary-color" defaultValue="#3b82f6" className="h-10 w-20" />
                <Input defaultValue="#3b82f6" className="flex-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ">
      {/* Sidebar */}
      <div className="lg:fixed lg:block lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:border-r lg:p-6 lg:z-50 hidden">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
        </div>

        <nav className="space-y-2 h-full">
          <button
            onClick={() => navigate('/')}
            className={`w-full cursor-pointer flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors`}
          >
            <LucideHome className="h-5 w-5" />
            <span className="font-medium">Home</span>
          </button>
          <button
            onClick={() => setCurrentPage('insights')}
            className={`w-full cursor-pointer flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'insights'
              ? 'bg-muted text-primary'
              : 'text-primary hover:bg-muted'
              }`}
          >
            <Activity className="h-5 w-5" />
            <span className="font-medium">Insights</span>
          </button>

          <button
            onClick={() => setCurrentPage('users')}
            className={`w-full cursor-pointer flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'users'
              ? 'bg-muted text-primary'
              : 'text-primary hover:bg-muted'
              }`}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Manage Users</span>
          </button>

          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-full cursor-pointer flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentPage === 'settings'
              ? 'bg-muted text-primary'
              : 'text-primary hover:bg-muted'
              }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button
            onClick={()=> {
              logout();
              navigate('/login');
            }}
            className={`mt-20 w-full cursor-pointer flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted`}
          >
            <LucideLogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>


      <div className="m-auto lg:ml-64 p-8">
        {currentPage === 'insights' && <InsightsPage />}
        {currentPage === 'users' && <ManageUsersPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </div>
    </div>
  );
};

export default Dashboard;