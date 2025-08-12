import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Beer, Ticket, Dumbbell, Shuffle } from "lucide-react";

type Opt = { slug: string; label: string; Icon: LucideIcon };

const OPTIONS: Opt[] = [
  { slug: "bar", label: "Bar", Icon: Beer },
  { slug: "show", label: "Show", Icon: Ticket },
  { slug: "workout", label: "Workout", Icon: Dumbbell },
  { slug: "random", label: "Random", Icon: Shuffle },
];

export default function Home() {
  return (
    <div className="flex h-full flex-col gap-6">
      <header className="mt-2">
        <h1 className="text-xl font-semibold">What are you in the mood for?</h1>
        <p className="text-sm text-zinc-300">Pick one to start swiping.</p>
      </header>

      <section className="grid grid-cols-2 gap-4">
        {OPTIONS.map(({ slug, label, Icon }) => (
          <Link key={slug} href={`/swipe/${slug}`} aria-label={label}>
            <div
              className="aspect-square rounded-2xl grid place-items-center transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: `inset 0 0 0 1px var(--color-brass), 0 6px 18px rgba(0,0,0,.25)`,
              }}
            >
              <Icon
                className="h-10 w-10"
                color="var(--color-gold)"
                style={{ filter: "drop-shadow(0 0 8px rgba(210,177,95,.35))" }}
              />
              <span className="sr-only">{label}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
