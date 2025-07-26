// src/types/router.ts
import { ReactNode } from 'react';
import { RouteObject } from 'react-router-dom';

// Existing types for TourProvider (kept for compatibility with previous code)
export interface TourStep {
  selector: string;
  content: string;
}

export interface TourStyles {
  popover?: (base: React.CSSProperties) => React.CSSProperties;
  maskArea?: (base: React.CSSProperties) => React.CSSProperties;
}

export interface TourProviderProps {
  steps: TourStep[];
  styles?: TourStyles;
  onClickMask?: (props: {
    setCurrentStep: (step: number) => void;
    currentStep: number;
    steps: TourStep[];
    setIsOpen: (isOpen: boolean) => void;
  }) => void;
}

export interface TourContext {
  setIsOpen: (isOpen: boolean) => void;
  setCurrentStep: (step: number) => void;
  currentStep: number;
  steps: TourStep[];
  isOpen: boolean;
}

// New type for layout components
export interface LayoutProps {
  children: ReactNode;
}