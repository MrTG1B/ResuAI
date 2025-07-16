
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Feedback } from '@/types/feedback';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackTableProps {
  feedback: Feedback[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Feedback</CardTitle>
        <CardDescription>A list of all feedback submitted by users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">From</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead className="w-[150px]">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.userName}</div>
                  <div className="text-xs text-muted-foreground">{item.userEmail}</div>
                </TableCell>
                <TableCell className="whitespace-pre-wrap">{item.feedback}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {feedback.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">No feedback yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
