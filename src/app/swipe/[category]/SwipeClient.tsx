"use client";

import { useMemo } from "react";
import Link from "next/link";
import SwipeStack from "@/components/SwipeStack";
import { useSelections, type Choice } from "@/store/selections";

const LABELS: Record<string, string> = {
    bar: "Bar",
    show: "Show",
    workout: "Workout",
    random: "Random",
};

export default function SwipeClient({ category }: { category: string }) {
    const cat = (category ?? "random").toLowerCase();
    const label = LABELS[cat] ?? cat;

    const items = useMemo<Choice[]>(
        () => getCategorySeeds(cat).map((s) => ({ ...s, category: cat })),
        [cat]
    );

    const addLike = useSelections((s) => s.addLike);
    const addPass = useSelections((s) => s.addPass);

    return (
        <div className="flex h-full flex-col">
            <header className="mb-3 mt-2 flex items-center justify-between">
                <h1 className="text-xl font-semibold">{label}</h1>
                <Link
                    href="/spin"
                    className="rounded-full px-3 py-1 text-sm"
                    style={{
                        color: "var(--color-secondary)",
                        backgroundColor: "var(--color-gold)",
                        boxShadow: "0 6px 18px rgba(210,177,95,.35)",
                    }}
                >
                    Go to Spin
                </Link>
            </header>

            <div className="flex-1">
                <SwipeStack
                    items={items}
                    onSwipe={(choice, dir) => {
                        if (dir === "right") addLike(cat, choice);
                        else addPass(cat, choice);
                    }}
                    emptyFallback={
                        <div className="flex h-full flex-col items-center justify-center gap-3">
                            <p className="text-zinc-300">You’re out of {label} cards.</p>
                            <Link
                                href="/spin"
                                className="rounded-full px-4 py-2 text-sm"
                                style={{
                                    color: "var(--color-secondary)",
                                    backgroundColor: "var(--color-gold)",
                                }}
                            >
                                Spin from Likes
                            </Link>
                        </div>
                    }
                />
            </div>
        </div>
    );
}

function getCategorySeeds(cat: string): Omit<Choice, "category">[] {
    const base = [
        { id: "1", title: "Tony Niks Cafe", subtitle: "Classic cocktails, cozy vibe", image: "/imgs/bar1.png" },
        { id: "2", title: "Columbus Cafe", subtitle: "Views + small plates", image: "/imgs/bar2.png" },
        { id: "3", title: "Boardroom", subtitle: "Password at the door", image: "/imgs/bar3.png" },
        { id: "4", title: "Tupelo", subtitle: "Nightly sets at 9PM", image: "/imgs/bar4.png" },
        { id: "5", title: "Lillie Coit's", subtitle: "Arcade bar", image: "/imgs/bar5.png" },
    ];
    const workout = [
        { id: "w1", title: "Bouldering Gym", subtitle: "Day pass", image: "/imgs/work1.png" },
        { id: "w2", title: "Late Spin Class", subtitle: "45 mins sweat", image: "/imgs/work2.png" },
    ];
    const show = [
        { id: "s1", title: "Comedy Night", subtitle: "9PM open mic", image: "/imgs/show1.png" },
        { id: "s2", title: "Indie Band", subtitle: "Local venue", image: "/imgs/show2.png" },
    ];

    switch (cat) {
        case "workout": return workout;
        case "show": return show;
        case "random": return shuffle([...base, ...workout, ...show]).slice(0, 6);
        case "bar":
        default: return base;
    }
}

function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
