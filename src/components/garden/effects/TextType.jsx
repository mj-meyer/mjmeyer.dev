// Reduced React Bits TextType adapter. The accepted type/hold/delete cycle is
// intentionally unchanged. See LICENSE.md and PROVENANCE.md.
import { useEffect, useState } from "react";

export default function TextType({
  text,
  paused = false,
  typingSpeed = 85,
  deletingSpeed = 45,
  pauseDuration = 6500,
}) {
  const [step, setStep] = useState(() => ({
    index: 0,
    count: text[0].length,
    deleting: false,
  }));
  const phrase = text[step.index];
  const holding = !step.deleting && step.count === phrase.length;
  useEffect(() => {
    if (paused) return;
    const timeout = setTimeout(
      () => {
        setStep(current => {
          const length = text[current.index].length;
          if (!current.deleting && current.count === length)
            return { ...current, deleting: true };
          if (current.deleting && current.count === 0)
            return {
              index: (current.index + 1) % text.length,
              count: 0,
              deleting: false,
            };
          return {
            ...current,
            count: current.count + (current.deleting ? -1 : 1),
          };
        });
      },
      holding ? pauseDuration : step.deleting ? deletingSpeed : typingSpeed
    );
    return () => clearTimeout(timeout);
  }, [step, text, paused, holding, typingSpeed, deletingSpeed, pauseDuration]);
  return (
    <span className="garden-text-type" data-typing={!paused && !holding}>
      {paused ? text[0] : phrase.slice(0, step.count)}
      <span className="garden-type-caret">_</span>
    </span>
  );
}
