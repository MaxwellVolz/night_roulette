"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { Choice } from "@/store/selections";

type Props = {
    items: Choice[];                 // top is index 0
    onSwipe: (choice: Choice, dir: "left" | "right") => void;
    emptyFallback?: React.ReactNode;
};

const SWIPE_THRESHOLD_PX = 110;
const SWIPE_VELOCITY_X = 600;

export default function SwipeStack({ items, onSwipe, emptyFallback }: Props) {
    const [stack, setStack] = useState<Choice[]>(items);

    useEffect(() => setStack(items), [items]);

    if (stack.length === 0) {
        return (
            <div className="grid h-full place-items-center">
                {emptyFallback ?? <p className="text-zinc-300">No more cards.</p>}
            </div>
        );
    }

    // Only the top card is draggable; below are static with slight scale/offset.
    const top = stack[0];
    const rest = stack.slice(1, 4); // render a small tail

    return (
        <div className="relative h-full w-full touch-pan-y select-none">
            {/* Tail cards */}
            {rest.map((c, i) => (
                <div
                    key={c.id}
                    className="absolute inset-0"
                    style={{
                        transform: `translateY(${12 + i * 8}px) scale(${1 - i * 0.04})`,
                        filter: "saturate(0.95)",
                    }}
                >
                    <CardShell choice={c} />
                </div>
            ))}

            {/* Top card (draggable) */}
            <DraggableCard
                key={top.id}
                choice={top}
                onDecision={(dir) => {
                    onSwipe(top, dir);
                    // remove top
                    setStack(prev => prev.slice(1));
                }}
            />
        </div>
    );
}

function DraggableCard({
    choice,
    onDecision,
}: {
    choice: Choice;
    onDecision: (dir: "left" | "right") => void;
}) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 0, 220], [-12, 0, 12]);
    const likeOpacity = useTransform(x, [20, 140], [0, 1]);
    const passOpacity = useTransform(x, [-140, -20], [1, 0]);

    return (
        <motion.div
            className="absolute inset-0"
            style={{ x, rotate }}
            drag="x"
            dragElastic={0.2}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
                const goRight = info.offset.x > SWIPE_THRESHOLD_PX || info.velocity.x > SWIPE_VELOCITY_X;
                const goLeft = info.offset.x < -SWIPE_THRESHOLD_PX || info.velocity.x < -SWIPE_VELOCITY_X * -1;

                if (goRight) {
                    void animateFlyOut(x, +1).then(() => onDecision("right"));
                } else if (goLeft) {
                    void animateFlyOut(x, -1).then(() => onDecision("left"));
                } else {
                    x.stop();
                    x.set(0);
                }
            }}
        >
            <CardShell choice={choice}>
                {/* PASS / LIKE badges */}
                <motion.div
                    className="absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-semibold"
                    style={{
                        opacity: passOpacity as any,
                        color: "var(--color-velvet)",
                        backgroundColor: "rgba(122,28,38,0.1)",
                        boxShadow: "inset 0 0 0 1px var(--color-velvet)",
                    }}
                >
                    PASS
                </motion.div>
                <motion.div
                    className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-semibold"
                    style={{
                        opacity: likeOpacity as any,
                        color: "var(--color-sage)",
                        backgroundColor: "rgba(95,140,98,0.12)",
                        boxShadow: "inset 0 0 0 1px var(--color-sage)",
                    }}
                >
                    LIKE
                </motion.div>
            </CardShell>
        </motion.div>
    );
}

async function animateFlyOut(x: any, dir: -1 | 1) {
    // fling out, quick
    x.stop();
    x.set(dir * 360);
    await new Promise(r => setTimeout(r, 160));
}

function CardShell({ choice, children }: { choice: Choice; children?: React.ReactNode }) {
    return (
        <div
            className="h-full w-full overflow-hidden rounded-3xl"
            style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: "inset 0 0 0 1px var(--color-brass), 0 12px 30px rgba(0,0,0,.35)",
            }}
        >
            {/* Image area */}
            <div className="relative h-[82%] w-full">
                {choice.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={choice.image}
                        alt={choice.title}
                        className="h-full w-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div className="h-full w-full bg-secondary" />
                )}
                {children}
            </div>
            {/* Text area */}
            <div className="p-4">
                <h3 className="text-lg font-semibold">{choice.title}</h3>
                {choice.subtitle && (
                    <p className="mt-1 text-sm text-zinc-300">{choice.subtitle}</p>
                )}
            </div>
        </div>
    );
}
