"use client";

import { useEffect, useState, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "@/lib/help-data";

interface OnboardingTourProps {
  userRole?: string;
}

const STORAGE_KEY = "onboarding_completed";

export function OnboardingTour({ userRole }: OnboardingTourProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const startTour = useCallback(() => {
    const filteredSteps = TOUR_STEPS.filter((step) => {
      if (!step.roles) return true;
      return userRole ? step.roles.includes(userRole) : true;
    });

    const driverSteps = filteredSteps
      .filter((step) => document.querySelector(step.element))
      .map((step) => ({
        element: step.element,
        popover: {
          title: step.title,
          description: step.description,
        },
      }));

    if (driverSteps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "black",
      overlayOpacity: 0.6,
      popoverClass: "onboarding-popover",
      nextBtnText: "التالي ←",
      prevBtnText: "→ السابق",
      doneBtnText: "تم!",
      progressText: "{{current}} من {{total}}",
      steps: driverSteps,
      onDestroyed: () => {
        localStorage.setItem(STORAGE_KEY, "true");
      },
    });

    driverObj.drive();
  }, [userRole]);

  useEffect(() => {
    if (!ready) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      startTour();
    }
  }, [ready, startTour]);

  return null;
}

export function useReplayTour() {
  return useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);
}
