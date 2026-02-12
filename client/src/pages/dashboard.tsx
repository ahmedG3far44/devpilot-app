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
import type { IUser, Page } from '@/types';


const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState<Page>('insights');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Mock users data
  const [users, setUsers] = useState<IUser[]>([]);

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
    const activeUsers = users.filter(u => u.blocked === false).length;
    const totalRepos = users.reduce((acc, _) => acc + 20, 0);
    const totalDeployments = users.reduce((acc, _) => acc + 10, 0);
    const blockedUsers = users.filter(u => u.blocked === true).length;

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
        user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.isAdmin === (roleFilter === 'admin');
      const matchesStatus = statusFilter === 'all' || user.blocked === (statusFilter === 'blocked');

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user =>
      user._id === userId
        ? { ...user, blocked: !user.blocked }
        : user
    ));
  };

  const getRoleBadgeColor = (isAdmin: boolean) => {
    return isAdmin ? 'bg-purple-500' : 'bg-blue-500';
  };

  const getStatusBadgeColor = (status: boolean) => {
    return status === false ? 'bg-green-500' : 'bg-red-500';
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
              {['admin', 'customer'].map(role => {
                const count = users.filter(u => u.isAdmin === true).length;
                const percentage = ((count / users.length) * 100).toFixed(0);
                return (
                  <div key={role} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{role}</span>
                      <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getRoleBadgeColor(role === 'admin')}`}
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
                key={user._id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-card  transition-colors"
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-primary font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-primary">{user.username}</h3>
                      <Badge className={`${getRoleBadgeColor(user.isAdmin)} text-white`}>
                        {user.isAdmin ? 'Admin' : 'Customer'}
                      </Badge>
                      <Badge className={`${getStatusBadgeColor(user.blocked)} text-white`}>
                        {user.blocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Mail className="h-3 w-3 mr-1" />
                      {"No email provided"}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FolderGit2 className="h-4 w-4 mr-1" />
                        <span>{user.location} Location</span>
                      </div>
                      <div className="flex items-center">
                        <Rocket className="h-4 w-4 mr-1" />
                        <span>{user.isAdmin ? 'Admin' : 'Customer'} Role</span>
                      </div>
                      <span className="text-gray-400">Joined {new Date(user.createdAt as Date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <Button
                    variant={user.blocked ? 'destructive' : 'default'}
                    size="sm"

                    onClick={() => toggleUserStatus(user._id)}
                  >
                    {user.blocked ? (
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
            onClick={() => {
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