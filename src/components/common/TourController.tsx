import { useEffect } from "react";
import { useTour } from "@reactour/tour";
import type { TourContext } from "@/types/router";

const TourController: React.FC = () => {
  const { setIsOpen, setCurrentStep } = useTour() as TourContext;

  useEffect(() => {
    // Start tour when component mounts (or based on your logic)
    const shouldStartTour = !localStorage.getItem("tourCompleted");

    if (shouldStartTour) {
      setIsOpen(true);
      setCurrentStep(0);
      localStorage.setItem("tourCompleted", "true");
    }
  }, [setIsOpen, setCurrentStep]);

  return null;
};

export default TourController;
