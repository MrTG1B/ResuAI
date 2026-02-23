
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MessageSquare, Search, RefreshCw, Loader2 } from 'lucide-react';
import { db, collection, getDocs, query, orderBy } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Feedback } from '@/types/feedback';

export default function FeedbackPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      const items: Feedback[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          feedback: data.feedback,
          userId: data.userId,
          userName: data.userName || 'N/A',
          userEmail: data.userEmail || 'N/A',
          createdAt: data.createdAt.toDate().toISOString(),
        };
      });
      setFeedback(items);
    } catch {
      toast({ title: "Error", description: "Failed to load feedback.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const filtered = feedback.filter(f =>
    search === '' ||
    f.userName.toLowerCase().includes(search.toLowerCase()) ||
    f.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    f.feedback.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Feedback</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All feedback submitted by users.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedback} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Feedback', value: feedback.length, color: 'text-pink-500' },
          { label: 'Unique Users', value: new Set(feedback.map(f => f.userId)).size, color: 'text-blue-500' },
          { label: 'Showing', value: filtered.length, color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className={`h-4 w-4 ${color}`} />
              <div>
                <div className="text-lg font-bold tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Feedback</CardTitle>
              <CardDescription className="text-xs">{filtered.length} of {feedback.length} items</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search feedback…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-56"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 w-40">From</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-32 text-right pr-4">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      <TableCell className="pl-4">
                        <div className="font-medium text-sm">{item.userName}</div>
                        <div className="text-xs text-muted-foreground">{item.userEmail}</div>
                      </TableCell>
                      <TableCell>
                        <p className={`text-sm text-muted-foreground transition-all ${expanded === item.id ? '' : 'line-clamp-2'}`}>
                          {item.feedback}
                        </p>
                        {item.feedback.length > 120 && (
                          <span className="text-xs text-primary hover:underline mt-0.5 block">
                            {expanded === item.id ? 'Show less' : 'Show more'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {search ? 'No feedback matches your search.' : 'No feedback yet.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
