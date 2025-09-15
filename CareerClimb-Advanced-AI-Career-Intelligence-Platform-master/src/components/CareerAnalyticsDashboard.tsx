import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, DollarSign, MapPin, Calendar, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const CareerAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    applicationStats: {
      total: 45,
      interviews: 12,
      offers: 3,
      rejections: 8,
      pending: 22
    },
    skillGaps: [
      { skill: 'React Native', current: 60, required: 85, priority: 'high' },
      { skill: 'System Design', current: 45, required: 80, priority: 'high' },
      { skill: 'AWS', current: 70, required: 85, priority: 'medium' },
      { skill: 'TypeScript', current: 80, required: 90, priority: 'low' },
      { skill: 'GraphQL', current: 40, required: 75, priority: 'medium' }
    ],
    salaryInsights: {
      currentRole: '$75,000',
      marketAverage: '$85,000',
      topPercentile: '$110,000',
      location: 'New York, NY'
    },
    applicationTrend: [
      { month: 'Jan', applications: 8, interviews: 2, offers: 0 },
      { month: 'Feb', applications: 12, interviews: 3, offers: 1 },
      { month: 'Mar', applications: 15, interviews: 4, offers: 1 },
      { month: 'Apr', applications: 10, interviews: 3, offers: 1 }
    ]
  });

  const [recommendations, setRecommendations] = useState([
    {
      type: 'skill',
      title: 'Complete React Native Course',
      description: 'Bridge the 25-point gap in React Native skills',
      priority: 'high',
      estimatedTime: '2-3 weeks'
    },
    {
      type: 'application',
      title: 'Optimize Application Strategy',
      description: 'Your interview rate is 26.7% - focus on quality over quantity',
      priority: 'medium',
      estimatedTime: '1 week'
    },
    {
      type: 'salary',
      title: 'Salary Negotiation Prep',
      description: 'You could increase salary by $10-35k based on market data',
      priority: 'high',
      estimatedTime: '3-5 days'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const applicationSuccessRate = (analyticsData.applicationStats.interviews / analyticsData.applicationStats.total * 100).toFixed(1);
  const offerRate = (analyticsData.applicationStats.offers / analyticsData.applicationStats.interviews * 100).toFixed(1);

  const pieData = [
    { name: 'Interviews', value: analyticsData.applicationStats.interviews, color: '#8884d8' },
    { name: 'Rejections', value: analyticsData.applicationStats.rejections, color: '#82ca9d' },
    { name: 'Pending', value: analyticsData.applicationStats.pending, color: '#ffc658' },
    { name: 'Offers', value: analyticsData.applicationStats.offers, color: '#ff7c7c' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Career Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Track your job search progress and optimize your strategy</p>
        </div>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.applicationStats.total}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">Above average (18%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offerRate}%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 22%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Position</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88th</div>
            <p className="text-xs text-muted-foreground">percentile for role</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Application Trend</CardTitle>
            <CardDescription>Monthly applications and outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.applicationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#8884d8" name="Applications" />
                <Line type="monotone" dataKey="interviews" stroke="#82ca9d" name="Interviews" />
                <Line type="monotone" dataKey="offers" stroke="#ffc658" name="Offers" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Current application breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Skill Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Gap Analysis</CardTitle>
          <CardDescription>Bridge these gaps to improve your competitiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.skillGaps.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.skill}</span>
                    <Badge variant={getPriorityColor(skill.priority)}>
                      {skill.priority}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {skill.current}% → {skill.required}%
                  </span>
                </div>
                <Progress value={skill.current} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Gap: {skill.required - skill.current} points
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Salary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Market Intelligence</CardTitle>
          <CardDescription>Understand your market value in {analyticsData.salaryInsights.location}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Your Current</div>
              <div className="text-2xl font-bold">{analyticsData.salaryInsights.currentRole}</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Market Average</div>
              <div className="text-2xl font-bold text-primary">{analyticsData.salaryInsights.marketAverage}</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Top 10%</div>
              <div className="text-2xl font-bold text-green-600">{analyticsData.salaryInsights.topPercentile}</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm">
              💡 <strong>Insight:</strong> You could potentially increase your salary by $10,000-$35,000 
              by focusing on the high-priority skill gaps identified above.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Recommendations</CardTitle>
          <CardDescription>Personalized action items to accelerate your career</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated time: {rec.estimatedTime}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CareerAnalyticsDashboard;