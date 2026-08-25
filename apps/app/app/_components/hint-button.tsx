import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { getLearningResource } from "./learning-catalog";

export function HintButton({ topic, label }: { topic: string; label?: string }) {
  const resource = getLearningResource(topic);
  if (!resource) return null;

  return (
    <details className="context-hint">
      <summary aria-label={label ?? `Help: ${resource.title}`} title={label ?? `Help: ${resource.title}`}>
        <Lightbulb size={13} />
      </summary>
      <div className="context-hint__popover" role="note">
        <span className="context-hint__eyebrow">Quick hint</span>
        <strong>{resource.title}</strong>
        <p>{resource.summary}</p>
        <Link href={`/learn?topic=${resource.id}`}>Open in Learning Center <ArrowRight size={13} /></Link>
      </div>
    </details>
  );
}
