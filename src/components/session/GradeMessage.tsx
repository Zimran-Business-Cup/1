import { Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { GradeResult } from "@/contracts/task";

/** The verdict after Submit. Code checks decide pass/fail; model checks only advise. */
export function GradeMessage({ grade, compact = false }: { grade: GradeResult; compact?: boolean }) {
  const codeChecks = grade.checks.filter((c) => c.by === "code");
  const passedCount = codeChecks.filter((c) => c.passed).length;

  return (
    <article className={`animate-rise overflow-hidden rounded-[1.5rem] border ${grade.passed ? "border-mint/40" : "border-rose/30"} bg-paper`}>
      <header className={`flex items-center gap-3 px-5 py-3.5 ${grade.passed ? "bg-mint-wash text-mint" : "bg-rose-wash text-rose"}`}>
        <span aria-hidden className={`grid size-8 place-items-center rounded-full text-paper ${grade.passed ? "bg-mint" : "bg-rose"}`}>
          {grade.passed ? <Check size={18} strokeWidth={2.6} /> : <X size={18} strokeWidth={2.6} />}
        </span>
        <p className="font-bold">
          {grade.passed ? "Passed" : "Not yet"}
          <span className="ml-2 font-semibold opacity-80">
            {passedCount} of {codeChecks.length} checks
          </span>
        </p>
      </header>

      <ul className={`space-y-2 px-5 pt-4 ${compact ? "text-[14px]" : "text-[15px]"}`}>
        {grade.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <span aria-hidden className={`mt-0.5 ${c.passed ? "text-mint" : "text-rose"}`}>
              {c.passed ? <Check size={16} strokeWidth={2.6} /> : <X size={16} strokeWidth={2.6} />}
            </span>
            <span className="min-w-0 flex-1">
              {c.label}
              {!c.passed && c.message && <span className="block text-ink-soft">{c.message}</span>}
            </span>
            <span
              title={c.by === "code" ? "Decided by code" : "Advice from the model"}
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${c.by === "code" ? "bg-hero-wash text-hero-deep" : "bg-steel/40 text-ink"}`}
            >
              {c.by}
            </span>
          </li>
        ))}
      </ul>

      <div className={`prose-chat px-5 pb-4 pt-3 leading-relaxed text-ink-soft ${compact ? "text-[14px]" : "text-[15px]"}`}>
        <ReactMarkdown>{grade.explanation}</ReactMarkdown>
      </div>
    </article>
  );
}
