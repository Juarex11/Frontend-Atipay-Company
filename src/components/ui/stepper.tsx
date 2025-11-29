import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
} from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly initialStep?: number;
  readonly onStepChange?: (step: number) => void;
  readonly onFinalStepCompleted?: () => void;
  // Presentation controls
  readonly variant?: "card" | "modal";
  readonly containerClassName?: string;
  readonly stepCircleContainerClassName?: string;
  readonly frameClassName?: string;
  readonly stepContainerClassName?: string;
  readonly contentClassName?: string;
  readonly footerClassName?: string;
  readonly backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  readonly nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  readonly backButtonText?: string;
  readonly nextButtonText?: string;
  readonly finalButtonText?: string;
  readonly finalButtonContent?: ReactNode;
  readonly onFinalAction?: () => void;
  readonly disableStepIndicators?: boolean;
  readonly renderStepIndicator?: (props: {
    readonly step: number;
    readonly currentStep: number;
    readonly onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  variant = "card",
  containerClassName = "",
  stepCircleContainerClassName = "",
  frameClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  finalButtonText = "Complete",
  finalButtonContent,
  onFinalAction,
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className={`${
        variant === "modal"
          ? "block min-h-0 p-0"
          : "flex min-h-full flex-1 flex-col items-center justify-center p-4 sm:aspect-[4/3] md:aspect-[2/1]"
      } ${containerClassName}`}
      {...rest}
    >
      <div
        className={`mx-auto w-full ${
          variant === "modal" ? "" : "max-w-md rounded-4xl shadow-xl"
        } ${stepCircleContainerClassName} ${frameClassName}`}
        style={variant === "modal" ? undefined : { border: "1px solid #222" }}
      >
        <div
          className={`${stepContainerClassName} flex w-full items-center ${
            variant === "modal" ? "px-6 pt-6 pb-2" : "p-8"
          }`}
        >
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 ${
            variant === "modal" ? "px-6" : "px-8"
          } ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div
            className={`${
              variant === "modal" ? "px-6 pb-6" : "px-8 pb-8"
            } ${footerClassName}`}
          >
            <div
              className={`mt-10 flex ${
                currentStep !== 1 ? "justify-between" : "justify-end"
              }`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className={`duration-350 rounded px-2 py-1 transition ${
                    currentStep === 1
                      ? "pointer-events-none opacity-50 text-neutral-400"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                onClick={() => {
                  if (isLastStep) {
                    onFinalAction ? onFinalAction() : handleComplete();
                  } else {
                    handleNext();
                  }
                }}
                className="duration-350 flex items-center justify-center rounded-full bg-green-500 py-1.5 px-3.5 font-medium tracking-tight text-white transition hover:bg-green-600 active:bg-green-700"
                {...nextButtonProps}
              >
                {isLastStep
                  ? finalButtonContent ?? finalButtonText
                  : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  readonly isCompleted: boolean;
  readonly currentStep: number;
  readonly direction: number;
  readonly children: ReactNode;
  readonly className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = "",
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: "spring", duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  readonly children: ReactNode;
  readonly direction: number;
  readonly onHeightReady: (height: number) => void;
}

function SlideTransition({
  children,
  direction,
  onHeightReady,
}: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: "absolute", left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "-100%" : "100%",
    opacity: 0,
  }),
  center: {
    x: "0%",
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "50%" : "-50%",
    opacity: 0,
  }),
};

interface StepProps {
  readonly children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <div className="px-8">{children}</div>;
}

interface StepIndicatorProps {
  readonly step: number;
  readonly currentStep: number;
  readonly onClickStep: (clicked: number) => void;
  readonly disableStepIndicators?: boolean;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators = false,
}: StepIndicatorProps) {
  const getStatus = () => {
    if (currentStep === step) return 'active';
    if (currentStep < step) return 'inactive';
    return 'complete';
  };
  
  const status = getStatus();

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: "#222", color: "#ffffff" },
          active: { scale: 1, backgroundColor: "#3EB365", color: "#3EB365" },
          complete: { scale: 1, backgroundColor: "#3EB365", color: "#ffffff" },
        }}
        className="h-3 w-3 rounded-full"
      >
        {status === "complete" && <CheckIcon className="h-4 w-4 text-black" />}
        {status === "active" && <div className="h-3 w-3 rounded-full bg-[#060010]" />}
        {status === "inactive" && <span className="text-sm">{step}</span>}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  readonly isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants = {
    complete: { width: "100%" },
    incomplete: { width: 0 },
  };

  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-neutral-600">
      <motion.div
        className="absolute left-0 top-0 h-full bg-green-500"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

interface CheckIconProps extends SVGProps<SVGSVGElement> {}

function CheckIcon({ className = "h-4 w-4", ...props }: CheckIconProps) {
  return (
    <svg
      {...props}
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: "tween",
          ease: "easeOut",
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
