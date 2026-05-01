"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const typingPhrases = [
  "Coordinate Rescues.",
  "Track Emergencies.",
  "Manage Resources.",
  "Deploy Teams.",
  "Save Lives.",
];

function TypingEffect() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = typingPhrases[phraseIndex];

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentPhrase.length) {
            setCharIndex((prev) => prev + 1);
          } else {
            setTimeout(() => setIsDeleting(true), 1500);
          }
        } else {
          if (charIndex > 0) {
            setCharIndex((prev) => prev - 1);
          } else {
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentPhrase]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500">
      {currentPhrase.slice(0, charIndex)}
      <span className="animate-pulse text-teal-500">|</span>
    </span>
  );
}

function HeroLottie() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load local animation from public/animations/hero.json
    fetch("/animations/hero.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load animation");
        return res.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => {
        console.error("Error loading Lottie animation:", err);
      });
  }, []);

  if (!animationData) {
    return (
      <div className="w-full max-w-[500px] aspect-square flex items-center justify-center">
        <div className="animate-pulse w-64 h-64 rounded-full bg-teal-100/50" />
      </div>
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className="w-full max-w-[500px]"
    />
  );
}

export default function HeroSection() {
  return (
    <section className="w-full pt-8 pb-12 md:pt-12 md:pb-20 lg:pt-24 lg:pb-28">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
        {/* Text Side */}
        <div className="flex-1 flex flex-col items-start text-left space-y-10 animate-fade-in-up">
          <div className="space-y-6 max-w-[650px]">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-black">
              Disaster Response <br />
              <TypingEffect />
            </h1>
            <p className="max-w-[520px] text-lg text-slate-600 md:text-xl/relaxed leading-relaxed font-medium">
              A real-time command center to coordinate rescues, allocate resources, and act instantly when every second counts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/report"
              className="relative group inline-flex h-12 items-center justify-center rounded-md bg-[#051522] px-8 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#0a243a]"
            >
              <ShieldAlert className="mr-2 h-5 w-5" />
              Report Incident
            </Link>
            <Link
              href="/dashboard"
              className="relative group inline-flex h-12 items-center justify-center rounded-md border-2 border-slate-200 bg-white px-8 text-base font-semibold text-black shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-105"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5 text-slate-400 group-hover:text-black transition-colors group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Lottie Animation Side */}
        <div className="flex-1 flex justify-center items-center md:-mt-28 lg:-mt-36">
          <HeroLottie />
        </div>
      </div>
    </section>
  );
}
