"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { db, doc, setDoc, getDoc } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface ToolAccessDialogProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const AVAILABLE_TOOLS = [
  { id: 'resume-builder', name: 'Resume Builder', description: 'Create and edit resumes' },
  { id: 'resume-analyzer', name: 'Resume Analyzer', description: 'Analyze resume for ATS optimization' },
  { id: 'portfolio', name: 'Portfolio Generator', description: 'Create portfolio websites' },
  { id: 'cover-letter', name: 'Cover Letter Generator', description: 'Generate cover letters' },
  { id: 'interview-prep', name: 'Interview Preparation', description: 'Interview practice and tips' },
  { id: 'aptitude-test', name: 'Aptitude Test', description: 'Practice aptitude tests' },
];

export function ToolAccessDialog({ userId, userName, isOpen, onClose, onUpdated }: ToolAccessDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [disabledTools, setDisabledTools] = useState<string[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadUserSettings = async () => {
    if (!db || !isOpen || initialLoadDone) return;
    
    setLoading(true);
    try {
      const settingsRef = doc(db, 'users', userId, 'admin', 'settings');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setDisabledTools(data.disabledTools || []);
      } else {
        setDisabledTools([]);
      }
      setInitialLoadDone(true);
    } catch (error) {
      console.error("Error loading user settings:", error);
      toast({
        title: "Error",
        description: "Failed to load user settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToolToggle = (toolId: string) => {
    setDisabledTools(prev => 
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSave = async () => {
    if (!db) {
      toast({ title: "Error", description: "Firebase not initialized.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const settingsRef = doc(db, 'users', userId, 'admin', 'settings');
      await setDoc(settingsRef, {
        disabledTools,
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: "Success",
        description: "Tool access updated successfully.",
      });
      onUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating tool access:", error);
      toast({
        title: "Error",
        description: "Failed to update tool access.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load settings when dialog opens
  if (isOpen && !initialLoadDone) {
    loadUserSettings();
  }

  // Reset when dialog closes
  if (!isOpen && initialLoadDone) {
    setInitialLoadDone(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Tool Access</DialogTitle>
          <DialogDescription>
            Control which tools <strong>{userName}</strong> can access.
          </DialogDescription>
        </DialogHeader>
        
        {loading && !initialLoadDone ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Unchecked tools will be disabled for this user.
            </p>
            {AVAILABLE_TOOLS.map((tool) => (
              <div key={tool.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                <Checkbox
                  id={tool.id}
                  checked={!disabledTools.includes(tool.id)}
                  onCheckedChange={() => handleToolToggle(tool.id)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={tool.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {tool.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
