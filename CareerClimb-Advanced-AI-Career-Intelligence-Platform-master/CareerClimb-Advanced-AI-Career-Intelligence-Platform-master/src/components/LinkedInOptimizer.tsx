import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Linkedin, TrendingUp, Users, MessageSquare, Lightbulb, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LinkedInOptimizer = () => {
  const [currentRole, setCurrentRole] = useState('');
  const [currentHeadline, setCurrentHeadline] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);
  const [connectionStrategy, setConnectionStrategy] = useState<any>(null);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const { toast } = useToast();

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Marketing', 'Sales', 
    'Engineering', 'Design', 'Consulting', 'Education', 'Legal'
  ];

  const generateHeadline = async () => {
    if (!currentRole || !industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in your current role and industry.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingHeadline(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-linkedin-profile', {
        body: {
          type: 'headline',
          currentRole,
          industry,
          experience: yearsExperience,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          currentProfile: currentHeadline
        }
      });

      if (error) throw error;
      
      setHeadlineSuggestions(data.suggestions);
      toast({
        title: "Headlines Generated",
        description: "AI-powered headline suggestions are ready!",
      });
    } catch (error) {
      console.error('Error generating headlines:', error);
      toast({
        title: "Error",
        description: "Failed to generate headlines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingHeadline(false);
    }
  };

  const generateConnectionStrategy = async () => {
    if (!targetRole || !industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in your target role and industry.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingStrategy(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-linkedin-profile', {
        body: {
          type: 'connection_strategy',
          targetRole,
          industry,
          currentRole,
          experience: yearsExperience,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      
      setConnectionStrategy(data.strategy);
      toast({
        title: "Strategy Generated",
        description: "Your personalized connection strategy is ready!",
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error", 
        description: "Failed to generate strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const generateContentIdeas = async () => {
    if (!industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in your industry.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-linkedin-profile', {
        body: {
          type: 'content_ideas',
          industry,
          currentRole,
          targetRole,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          experience: yearsExperience
        }
      });

      if (error) throw error;
      
      setContentIdeas(data.ideas);
      toast({
        title: "Content Ideas Generated",
        description: "Fresh content ideas for your LinkedIn posts!",
      });
    } catch (error) {
      console.error('Error generating content ideas:', error);
      toast({
        title: "Error",
        description: "Failed to generate content ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard successfully.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Linkedin className="w-6 h-6" />
            LinkedIn Profile Optimizer
          </h2>
          <p className="text-muted-foreground">AI-powered LinkedIn optimization for career growth</p>
        </div>
      </div>

      <Tabs defaultValue="headlines" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="headlines">Headlines</TabsTrigger>
          <TabsTrigger value="content">Content Ideas</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
        </TabsList>

        <TabsContent value="headlines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Enter your professional details for personalized headline suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Role</label>
                  <Input
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Industry</label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Years of Experience</label>
                  <Select value={yearsExperience} onValueChange={setYearsExperience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Role (Optional)</label>
                  <Input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Key Skills (comma-separated)</label>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., React, Node.js, Python, Machine Learning"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Current Headline (Optional)</label>
                <Input
                  value={currentHeadline}
                  onChange={(e) => setCurrentHeadline(e.target.value)}
                  placeholder="Your current LinkedIn headline"
                />
              </div>

              <Button onClick={generateHeadline} disabled={isGeneratingHeadline} className="w-full">
                {isGeneratingHeadline ? 'Generating Headlines...' : 'Generate AI-Powered Headlines'}
              </Button>
            </CardContent>
          </Card>

          {headlineSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Optimized Headlines
                </CardTitle>
                <CardDescription>Click to copy any headline that resonates with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {headlineSuggestions.map((headline, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer group"
                       onClick={() => copyToClipboard(headline)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">{headline}</p>
                      <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Content Ideas Generator
              </CardTitle>
              <CardDescription>Generate engaging LinkedIn post ideas for your industry</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateContentIdeas} disabled={isGeneratingContent || !industry}>
                {isGeneratingContent ? 'Generating Ideas...' : 'Generate Content Ideas'}
              </Button>
            </CardContent>
          </Card>

          {contentIdeas.length > 0 && (
            <div className="grid gap-4">
              {contentIdeas.map((idea, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{idea.type}</CardTitle>
                      <Badge variant="outline">{idea.type?.toLowerCase().replace(' ', '_')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <h4 className="font-semibold">{idea.title}</h4>
                    <p className="text-sm text-muted-foreground">{idea.content}</p>
                    {idea.hashtags && (
                      <div className="flex flex-wrap gap-1">
                        {idea.hashtags.map((hashtag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{hashtag}</Badge>
                        ))}
                      </div>
                    )}
                    {idea.engagementHook && (
                      <div className="p-2 bg-primary/10 rounded text-sm">
                        <strong>Engagement Hook:</strong> {idea.engagementHook}
                      </div>
                    )}
                    <Button 
                      onClick={() => copyToClipboard(`${idea.title}\n\n${idea.content}\n\n${idea.hashtags?.join(' ') || ''}`)}
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Post Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="networking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Networking Strategy Generator
              </CardTitle>
              <CardDescription>Create a targeted LinkedIn networking strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateConnectionStrategy} disabled={isGeneratingStrategy || !industry || !targetRole}>
                {isGeneratingStrategy ? 'Creating Strategy...' : 'Generate Networking Strategy'}
              </Button>
            </CardContent>
          </Card>

          {connectionStrategy && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Connection Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{connectionStrategy.dailyConnections} connections/day</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Target Profiles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {connectionStrategy.targetProfiles?.map((profile: string, index: number) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm">• {profile}</div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {connectionStrategy.messageTemplates?.map((template: string, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded">
                      <p className="text-sm mb-2">Template {index + 1}:</p>
                      <p className="text-sm italic">"{template}"</p>
                      <Button 
                        onClick={() => copyToClipboard(template)}
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Copy Template
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {connectionStrategy.engagementTips && (
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {connectionStrategy.engagementTips.map((tip: string, index: number) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">• {tip}</div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {connectionStrategy.industrySpecificAdvice && (
                <Card>
                  <CardHeader>
                    <CardTitle>Industry-Specific Advice</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {connectionStrategy.industrySpecificAdvice.map((advice: string, index: number) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">• {advice}</div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LinkedInOptimizer;