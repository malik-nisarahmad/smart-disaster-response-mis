import React from "react";

interface FeatureSectionProps {
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
}

export default function FeatureSection({ title, description, visual, reverse = false }: FeatureSectionProps) {
  return (
    <section className="w-full py-8 md:py-12">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <div className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-16`}>
          <div className="flex-1 space-y-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">{title}</h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[480px]">{description}</p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-3xl bg-[#ccfbf1]/40 flex items-center justify-center overflow-hidden">
              {visual}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
