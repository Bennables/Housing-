import { Info } from "lucide-react";
import { DISCLAIMER } from "@/lib/constants";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm text-muted-foreground ${className}`}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {DISCLAIMER} This site does not give legal or financial advice.
      </span>
    </p>
  );
}
