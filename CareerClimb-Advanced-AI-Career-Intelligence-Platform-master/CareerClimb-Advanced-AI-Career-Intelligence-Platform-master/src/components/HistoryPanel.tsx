import { useState } from 'react'
import { Clock, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useUserHistory, HistoryItem } from '@/hooks/useUserHistory'

interface HistoryPanelProps {
  onRestore: (item: HistoryItem) => void
}

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const { history, deleteItem, clearHistory, exportHistory } = useUserHistory()
  const [isOpen, setIsOpen] = useState(false)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'resume_analysis': return 'Resume Analysis'
      case 'email_generation': return 'Email Generation'
      case 'interview_questions': return 'Interview Prep'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resume_analysis': return 'bg-primary'
      case 'email_generation': return 'bg-secondary'
      case 'interview_questions': return 'bg-accent'
      default: return 'bg-muted'
    }
  }

  if (history.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No history yet. Start using the platform to see your past analyses!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            History ({history.length})
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportHistory}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="destructive" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.slice(0, 10).map((item) => (
          <Collapsible key={item.id}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Badge className={getTypeColor(item.type)}>
                    {getTypeLabel(item.type)}
                  </Badge>
                  <div>
                   <p className="text-sm font-medium">
                     {new Date(item.timestamp).toLocaleDateString()} at{' '}
                     {new Date(item.timestamp).toLocaleTimeString()}
                   </p>
                    {item.score && (
                      <p className="text-xs text-muted-foreground">
                        Score: {item.score}/100
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestore(item)
                    }}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteItem(item.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-3 text-sm text-muted-foreground">
              <div className="space-y-2">
                <div>
                  <strong>Input:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-20">
                    {JSON.stringify(item.input, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Output:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-20">
                    {typeof item.output === 'string' ? item.output : JSON.stringify(item.output, null, 2)}
                  </pre>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}