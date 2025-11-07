"use client";

import { useState } from "react";
import { WelcomeStep } from "./WelcomeStep";
import { EisenhowerExplanationStep } from "./EisenhowerExplanationStep";
import { FirstProjectStep } from "./FirstProjectStep";
import { FirstTaskStep } from "./FirstTaskStep";
import { CompletionStep } from "./CompletionStep";

export interface OnboardingWizardProps {
  onComplete: (projectData: { name: string; color: string; description: string; taskTitle: string; quadrant: string }) => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("blue");
  const [projectDescription, setProjectDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [quadrant, setQuadrant] = useState("schedule");

  const handleSkip = () => {
    onSkip();
  };

  const handleNextFromWelcome = () => {
    setCurrentStep(2);
  };

  const handleNextFromEisenhower = () => {
    setCurrentStep(3);
  };

  const handleNextFromFirstProject = (data: { name: string; color: string; description: string }) => {
    setProjectName(data.name);
    setProjectColor(data.color);
    setProjectDescription(data.description);
    setCurrentStep(4);
  };

  const handleNextFromFirstTask = (data: { title: string; quadrant: string }) => {
    setTaskTitle(data.title);
    setQuadrant(data.quadrant);
    setCurrentStep(5);
  };

  const handleComplete = () => {
    onComplete({
      name: projectName,
      color: projectColor,
      description: projectDescription,
      taskTitle,
      quadrant,
    });
  };

  const handlePrevFromEisenhower = () => {
    setCurrentStep(1);
  };

  const handlePrevFromFirstProject = () => {
    setCurrentStep(2);
  };

  const handlePrevFromFirstTask = () => {
    setCurrentStep(3);
  };

  const handlePrevFromCompletion = () => {
    setCurrentStep(4);
  };

  return (
    <>
      {currentStep === 1 && (
        <WelcomeStep
          onNext={handleNextFromWelcome}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 2 && (
        <EisenhowerExplanationStep
          onNext={handleNextFromEisenhower}
          onPrev={handlePrevFromEisenhower}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 3 && (
        <FirstProjectStep
          onNext={handleNextFromFirstProject}
          onPrev={handlePrevFromFirstProject}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 4 && (
        <FirstTaskStep
          projectName={projectName}
          onNext={handleNextFromFirstTask}
          onPrev={handlePrevFromFirstTask}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 5 && (
        <CompletionStep
          projectName={projectName}
          taskTitle={taskTitle}
          onNext={handleComplete}
          onPrev={handlePrevFromCompletion}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
