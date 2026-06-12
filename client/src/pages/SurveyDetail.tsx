import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, Zap, ArrowLeft, CheckCircle } from "lucide-react";

export default function SurveyDetail() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const surveyId = parseInt(location.split("/").pop() || "0");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: survey, isLoading: surveyLoading } = trpc.survey.getById.useQuery(
    { id: surveyId },
    { enabled: isAuthenticated && surveyId > 0 }
  );

  const startResponse = trpc.survey.startResponse.useMutation();
  const submitResponse = trpc.survey.submitResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Survey completed! Points have been added to your wallet.");
      setTimeout(() => navigate("/surveys"), 2000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (survey && isAuthenticated) {
      startResponse.mutate({ surveyId });
    }
  }, [survey, isAuthenticated]);

  if (authLoading || surveyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Zap className="w-8 h-8 text-accent" />
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Survey Not Found</h1>
          <Button onClick={() => navigate("/surveys")}>Back to Surveys</Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-12 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-2">Survey completed successfully</p>
          <p className="text-2xl font-bold text-accent mb-6">{survey.pointsReward} points earned</p>
          <p className="text-sm text-muted-foreground">Redirecting to surveys...</p>
        </Card>
      </div>
    );
  }

  const questions = survey.questions || [];
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [question.id]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const answerArray = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id],
    }));

    submitResponse.mutate({
      surveyId,
      answers: answerArray,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/surveys")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Surveys
          </Button>
          <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {survey.estimatedDurationMinutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {survey.estimatedDurationMinutes} minutes
              </div>
            )}
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {survey.pointsReward} points
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          {question && (
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">{question.questionText}</h2>

              {question.description && (
                <p className="text-muted-foreground mb-6">{question.description}</p>
              )}

              <div className="space-y-4">
                {question.type === "multiple_choice" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswer(value)}
                  >
                    {(question.options as Array<{ id: string; label: string }>)?.map(
                      (option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      )
                    )}
                  </RadioGroup>
                )}

                {question.type === "checkbox" && (
                  <div className="space-y-2">
                    {(question.options as Array<{ id: string; label: string }>)?.map(
                      (option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={(answers[question.id] || []).includes(option.id)}
                            onCheckedChange={(checked) => {
                              const current = answers[question.id] || [];
                              if (checked) {
                                handleAnswer([...current, option.id]);
                              } else {
                                handleAnswer(current.filter((id: string) => id !== option.id));
                              }
                            }}
                          />
                          <Label htmlFor={option.id} className="font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                )}

                {question.type === "rating" && (
                  <div className="flex gap-2">
                    {Array.from({ length: question.ratingScale || 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i + 1)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                          answers[question.id] === i + 1
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "open_text" && (
                  <Textarea
                    placeholder="Enter your answer..."
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="min-h-32"
                  />
                )}

                {question.type === "dropdown" && (
                  <select
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input"
                  >
                    <option value="">Select an option...</option>
                    {(question.options as Array<{ id: string; label: string }>)?.map(
                      (option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitResponse.isPending}
                className="gap-2"
              >
                {submitResponse.isPending ? "Submitting..." : "Submit Survey"}
              </Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
