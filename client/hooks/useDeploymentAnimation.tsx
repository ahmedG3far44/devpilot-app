import { useState, useEffect } from 'react';
import { DEPLOYMENT_STEPS } from '../src/lib/utils';

import type { DeploymentStep } from '../src/types/index';

export const useDeploymentAnimation = () => {
  const [terminalLines, setTerminalLines] = useState<DeploymentStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const step = DEPLOYMENT_STEPS[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      if (step.type === 'reset') {
        setTerminalLines([]);
        setCurrentStep(0);
      } else {
        setTerminalLines((prev) => [...prev, step]);
        setCurrentStep((prev) => prev + 1);
      }
    }, step.delay);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return { terminalLines };
};