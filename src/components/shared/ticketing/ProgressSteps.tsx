import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  description?: string;
}

interface ProgressStepsProps {
  currentStep: number;
  steps?: Step[];
}

const defaultSteps: Step[] = [
  { id: 1, name: 'Select Tickets', description: 'Choose your tickets' },
  { id: 2, name: 'Attendee Info', description: 'Enter your details' },
  { id: 3, name: 'Payment', description: 'Complete payment' },
  { id: 4, name: 'Confirmation', description: 'Get your tickets' },
];

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ 
  currentStep, 
  steps = defaultSteps 
}) => {
  return (
    <div className="w-full py-6">
      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div className="relative">
                  <div
                    className={`
                      w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold text-sm
                      transition-all duration-200
                      ${
                        step.id < currentStep
                          ? 'bg-green-500 border-green-500 text-white'
                          : step.id === currentStep
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                </div>
                
                {/* Label */}
                <div className="mt-2 text-center">
                  <div
                    className={`
                      text-sm font-medium
                      ${
                        step.id <= currentStep
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.name}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 px-4 pb-12">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-200
                      ${
                        step.id < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical stepper */}
      <div className="md:hidden">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="flex items-start">
                {/* Circle and connector */}
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm
                      transition-all duration-200
                      ${
                        step.id < currentStep
                          ? 'bg-green-500 border-green-500 text-white'
                          : step.id === currentStep
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  {/* Vertical line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-0.5 h-16 mt-2 transition-all duration-200
                        ${
                          step.id < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }
                      `}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div
                    className={`
                      text-base font-medium
                      ${
                        step.id <= currentStep
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.name}
                  </div>
                  {step.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Step {currentStep} of {steps.length}</span>
          <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressSteps;








