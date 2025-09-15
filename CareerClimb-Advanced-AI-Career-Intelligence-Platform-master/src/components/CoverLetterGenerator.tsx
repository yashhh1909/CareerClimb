import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoverLetter {
  id?: string;
  company_name: string;
  job_title: string;
  job_description: string;
  company_culture: string;
  tone: string;
  content: string;
  created_at?: string;
}

const CoverLetterGenerator = () => {
  const [jobDetails, setJobDetails] = useState({
    company: '',
    position: '',
    jobDescription: '',
    companyInfo: ''
  });
  
  const [tone, setTone] = useState('professional');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedLetters, setSavedLetters] = useState<CoverLetter[]>([]);
  const { toast } = useToast();

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'creative', label: 'Creative' },
    { value: 'technical', label: 'Technical' },
    { value: 'friendly', label: 'Friendly' }
  ];

  const generateCoverLetter = async () => {
    if (!jobDetails.company || !jobDetails.position) {
      toast({
        title: 'Missing Information',
        description: 'Please provide company name and position',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          prompt: `Generate a compelling cover letter with the following details:
                  
                  Company: ${jobDetails.company}
                  Position: ${jobDetails.position}
                  Job Description: ${jobDetails.jobDescription}
                  Company Information: ${jobDetails.companyInfo}
                  Tone: ${tone}
                  
                  Create a personalized cover letter that:
                  1. Addresses the specific company and role
                  2. Highlights relevant skills and experience
                  3. Matches the company culture and values
                  4. Uses the specified tone
                  5. Includes a strong opening and closing
                  6. Is approximately 3-4 paragraphs
                  
                  Make it professional, engaging, and tailored to this specific opportunity.`,
          type: 'cover_letter_generation'
        }
      });

      if (error) throw error;

      setGeneratedLetter(data.response);

      toast({
        title: 'Cover Letter Generated!',
        description: 'Your personalized cover letter is ready',
      });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: 'Generation Error',
        description: 'Failed to generate cover letter',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCoverLetter = async () => {
    if (!generatedLetter) return;

    try {
      await (supabase as any).from('cover_letters').insert({
        company_name: jobDetails.company,
        job_title: jobDetails.position,
        job_description: jobDetails.jobDescription,
        company_culture: jobDetails.companyInfo,
        tone,
        content: generatedLetter
      });

      toast({
        title: 'Cover Letter Saved!',
        description: 'Your cover letter has been saved for future reference',
      });

      loadSavedLetters();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save cover letter',
        variant: 'destructive'
      });
    }
  };

  const loadSavedLetters = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cover_letters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSavedLetters(data || []);
    } catch (error) {
      console.error('Error loading saved letters:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast({
      title: 'Copied!',
      description: 'Cover letter copied to clipboard',
    });
  };

  const downloadLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${jobDetails.company}-${jobDetails.position}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const regenerateLetter = () => {
    setGeneratedLetter('');
    generateCoverLetter();
  };

  React.useEffect(() => {
    loadSavedLetters();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            AI Cover Letter Generator
          </h2>
          <p className="text-muted-foreground">Create personalized cover letters that match company culture</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Provide information about the position and company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Company Name *</label>
                <Input
                  value={jobDetails.company}
                  onChange={(e) => setJobDetails({...jobDetails, company: e.target.value})}
                  placeholder="Google, Microsoft, etc."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Position Title *</label>
                <Input
                  value={jobDetails.position}
                  onChange={(e) => setJobDetails({...jobDetails, position: e.target.value})}
                  placeholder="Senior Software Engineer"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Job Description</label>
              <Textarea
                value={jobDetails.jobDescription}
                onChange={(e) => setJobDetails({...jobDetails, jobDescription: e.target.value})}
                placeholder="Paste the job description here for better personalization..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Company Culture & Values</label>
              <Textarea
                value={jobDetails.companyInfo}
                onChange={(e) => setJobDetails({...jobDetails, companyInfo: e.target.value})}
                placeholder="Information about company culture, values, recent news, or specific details you want to mention..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateCoverLetter} 
              disabled={isLoading || !jobDetails.company || !jobDetails.position}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Cover Letter
              <div className="flex gap-2">
                {generatedLetter && (
                  <>
                    <Button onClick={regenerateLetter} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button onClick={downloadLetter} variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedLetter ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{generatedLetter}</pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCoverLetter} variant="default">
                    Save Cover Letter
                  </Button>
                  <Badge variant="outline">
                    {tone} tone
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Your generated cover letter will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Letters */}
      {savedLetters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Cover Letters</CardTitle>
            <CardDescription>Your previously generated cover letters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedLetters.map((letter, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{letter.job_title} at {letter.company_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {letter.created_at ? new Date(letter.created_at).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <Badge variant="outline">{letter.tone}</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedLetter(letter.content)}
                  >
                    Load Letter
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoverLetterGenerator;