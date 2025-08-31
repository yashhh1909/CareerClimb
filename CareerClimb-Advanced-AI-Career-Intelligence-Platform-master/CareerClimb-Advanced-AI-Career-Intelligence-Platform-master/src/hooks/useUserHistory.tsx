import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface HistoryItem {
  id: string;
  type: string;
  timestamp: string;
  input?: string;
  output?: string;
  score?: number;
}

export function useUserHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHistory = data?.map(item => ({
        id: item.id,
        type: item.type,
        timestamp: item.created_at,
        input: item.input || undefined,
        output: item.output || undefined,
        score: item.score || undefined,
      })) || [];

      setHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_history')
        .insert({
          user_id: user.id,
          type: item.type,
          input: item.input,
          output: item.output,
          score: item.score,
        });

      if (error) throw error;

      // Refresh history after adding
      fetchHistory();
    } catch (error) {
      console.error('Error adding history item:', error);
      toast({
        title: "Error",
        description: "Failed to save to history",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "History item deleted",
      });
    } catch (error) {
      console.error('Error deleting history item:', error);
      toast({
        title: "Error",
        description: "Failed to delete history item",
        variant: "destructive",
      });
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory([]);
      toast({
        title: "Success",
        description: "History cleared",
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `career_history_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  return {
    history,
    loading,
    addHistoryItem,
    deleteItem,
    clearHistory,
    exportHistory,
    fetchHistory,
  };
}