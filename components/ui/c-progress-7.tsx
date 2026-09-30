import { Progress } from "@/components/ui/progress";
import { CircleCheckIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProgressStep = { label: string; completed: boolean };

const sampleSteps: ProgressStep[] = [
  { label: "Account", completed: true },
  { label: "Profile", completed: true },
  { label: "Preferences", completed: false },
  { label: "Review", completed: false },
];

export default function Pattern({ steps = sampleSteps, title = "Setup progress", currentStep, className }: { steps?: ProgressStep[]; title?: string; currentStep?: number; className?: string }) {
  const completedSteps = steps.filter((step) => step.completed).length;
  const progressValue = steps.length ? (completedSteps / steps.length) * 100 : 0;

  return (
    <div className={cn("w-full max-w-md space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{completedSteps} of {steps.length} complete</span>
      </div>
      <Progress value={progressValue} aria-label={title} />
      <ol aria-label={title} className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.label} aria-current={currentStep === index ? "step" : undefined} className="flex min-h-8 items-center gap-2 text-sm">
            {step.completed ? <CircleCheckIcon className="size-4 shrink-0 text-success" aria-hidden="true" /> : <CircleIcon className={cn("size-4 shrink-0", currentStep === index ? "text-mc-orange-dark" : "text-muted-foreground")} aria-hidden="true" />}
            <span className={cn(step.completed || currentStep === index ? "font-semibold text-foreground" : "text-muted-foreground")}>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
