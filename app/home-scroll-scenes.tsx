"use client";

import { useEffect } from "react";

export function HomeScrollScenes() {
  useEffect(() => {
    const scenes = document.querySelectorAll(".home-process, .home-certificate, .inspection-section, .brand-showcase__hero, .home-final-cta");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("home-scene--visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12 });

    scenes.forEach((scene) => {
      scene.classList.add("home-scene--ready");
      observer.observe(scene);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
