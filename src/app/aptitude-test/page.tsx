
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type GenerateAptitudeExamOutput } from '@/ai/flows/generate-aptitude-exam';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreativeLoader } from '@/components/creative-loader';

type Question = GenerateAptitudeExamOutput['logicalReasoning'][0];
type ExamQuestions = {
    logicalReasoning: Question[];
    quantitativeAnalysis: Question[];
    verbalAbility: Question[];
};
type UserAnswers = { [key: number]: number };

const TOTAL_TIME = 15 * 60; // 15 minutes in seconds

const generatingTexts = [
  "Crafting unique logical puzzles...",
  "Calculating quantitative challenges...",
  "Assembling verbal reasoning questions...",
  "Building your exam...",
  "Almost ready...",
];

function AptitudeTestPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [examState, setExamState] = useState<'idle' | 'loading' | 'ongoing' | 'finished'>('idle');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    if (!auth) {
        toast({ title: "Authentication Error", description: "Firebase is not configured.", variant: "destructive" });
        router.push('/login');
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setCurrentUser(user);
        setIsPageLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

  useEffect(() => {
    if (examState !== 'ongoing') return;
    if (timeLeft <= 0) {
      handleFinishExam();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState, timeLeft]);

  const startExam = async () => {
    if (!currentUser) return;
    setExamState('loading');
    try {
      // Call the Genkit flow API endpoint directly
      const response = await fetch('/api/genkit/flow/generateAptitudeExam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            logicalReasoningCount: 5,
            quantitativeAnalysisCount: 5,
            verbalAbilityCount: 5
          }
        })
      });

      if (!response.ok) {
        let errorDetails = "Failed to generate exam.";
        try {
            const errorData = await response.json();
            errorDetails = errorData.error?.message || errorData.error || errorDetails;
        } catch (e) {
            console.error("Could not parse error response as JSON:", await response.text());
        }
        throw new Error(errorDetails);
      }
      
      const result = await response.json();
      const examData = result.output as GenerateAptitudeExamOutput;
      
      const allQuestions = [
        ...examData.logicalReasoning,
        ...examData.quantitativeAnalysis,
        ...examData.verbalAbility
      ];

      setExamQuestions(allQuestions);
      setExamState('ongoing');
      setTimeLeft(TOTAL_TIME);
      setUserAnswers({});
      setCurrentQuestionIndex(0);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setExamState('idle');
    }
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleFinishExam = useCallback(() => {
    setExamState('finished');
    let correct = 0;
    examQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        correct++;
      }
    });
    setScore({ correct, total: examQuestions.length });
  }, [examQuestions, userAnswers]);

  const resetExam = () => {
    setExamState('idle');
    setScore(null);
  };

  if (isPageLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl">
          {examState === 'idle' && (
            <Card className="shadow-2xl text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">Aptitude Test</CardTitle>
                <CardDescription className="mt-2 text-lg">
                  Prepare for your interviews with a timed aptitude test covering logical, quantitative, and verbal skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">You will have <strong>{TOTAL_TIME / 60} minutes</strong> to complete the test. Are you ready?</p>
                <Button size="lg" onClick={startExam}>Start Exam</Button>
              </CardContent>
            </Card>
          )}

          {examState === 'loading' && (
             <Card className="shadow-2xl">
                <CardContent className="p-8 h-96 flex items-center justify-center">
                    <CreativeLoader texts={generatingTexts} />
                </CardContent>
            </Card>
          )}

          {examState === 'ongoing' && (
            <Card className="shadow-2xl">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-heading">Aptitude Exam</CardTitle>
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Clock className="h-5 w-5" />
                    <span>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</span>
                  </div>
                </div>
                 <Progress value={(currentQuestionIndex / examQuestions.length) * 100} className="mt-2 h-2" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6 min-h-[300px]">
                  <p className="text-lg font-semibold">{currentQuestionIndex + 1}. {examQuestions[currentQuestionIndex].question}</p>
                  <RadioGroup
                    onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
                    value={userAnswers[currentQuestionIndex]?.toString()}
                    className="space-y-3"
                  >
                    {examQuestions[currentQuestionIndex].options.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-all">
                        <RadioGroupItem value={idx.toString()} id={`q${currentQuestionIndex}-o${idx}`} />
                        <Label htmlFor={`q${currentQuestionIndex}-o${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0}>Previous</Button>
                {currentQuestionIndex < examQuestions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestionIndex(p => p + 1)}>Next</Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>Finish Exam</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to finish?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Any unanswered questions will be marked as incorrect. You cannot go back once you submit.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinishExam}>Submit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          )}

          {examState === 'finished' && score && (
            <Card className="shadow-2xl text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">Test Completed!</CardTitle>
                <CardDescription className="mt-2 text-lg">Here's how you performed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center items-center">
                    <div className="relative h-40 w-40">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                className="text-muted"
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className="text-primary"
                                strokeDasharray={`${(score.correct / score.total) * 100}, 100`}
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                transform="rotate(90 18 18)"
                            />
                        </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-foreground">
                                {Math.round((score.correct / score.total) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-500"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Correct Answers</p>
                            <p className="text-2xl font-bold">{score.correct}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <XCircle className="h-8 w-8 text-destructive"/>
                         <div>
                            <p className="text-sm text-muted-foreground">Incorrect Answers</p>
                            <p className="text-2xl font-bold">{score.total - score.correct}</p>
                        </div>
                    </div>
                </div>

                <Button size="lg" onClick={resetExam}>Take Another Test</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AptitudeTestPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <AptitudeTestPageContent />
        </Suspense>
    );
}
