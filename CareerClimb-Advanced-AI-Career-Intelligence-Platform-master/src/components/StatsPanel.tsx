import { useMemo } from 'react'
import { TrendingUp, FileText, Mail, MessageSquare, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface HistoryItem {
  id: string
  type: 'resume_analysis' | 'email_generation' | 'interview_questions'
  timestamp: number
  input: any
  output: any
  score?: number
}

export function StatsPanel() {
  const [history] = useLocalStorage<HistoryItem[]>('career_assistant_history', [])

  const stats = useMemo(() => {
    const totalAnalyses = history.length
    const resumeAnalyses = history.filter(h => h.type === 'resume_analysis')
    const emailGenerations = history.filter(h => h.type === 'email_generation')
    const interviewPreps = history.filter(h => h.type === 'interview_questions')
    
    const avgScore = resumeAnalyses.length > 0 
      ? Math.round(resumeAnalyses.reduce((sum, item) => sum + (item.score || 0), 0) / resumeAnalyses.length)
      : 0

    const bestScore = resumeAnalyses.length > 0
      ? Math.max(...resumeAnalyses.map(item => item.score || 0))
      : 0

    const thisWeek = history.filter(h => 
      Date.now() - h.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length

    return {
      totalAnalyses,
      resumeAnalyses: resumeAnalyses.length,
      emailGenerations: emailGenerations.length,
      interviewPreps: interviewPreps.length,
      avgScore,
      bestScore,
      thisWeek
    }
  }, [history])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
          <p className="text-xs text-muted-foreground">
            {stats.thisWeek} this week
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resume Score</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgScore}/100</div>
          <p className="text-xs text-muted-foreground">
            Best: {stats.bestScore}/100
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Replies</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.emailGenerations}</div>
          <p className="text-xs text-muted-foreground">
            Generated responses
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interview Prep</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.interviewPreps}</div>
          <p className="text-xs text-muted-foreground">
            Practice sessions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}