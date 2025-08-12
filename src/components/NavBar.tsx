"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Grid2X2, Crown, Heart, RotateCw, Pin, Group, Blocks, Vote, Dices } from "lucide-react";

type Item = { href: string; label: string; Icon: LucideIcon };

const items: Item[] = [
    { href: "/", label: "Home", Icon: Blocks },
    // { href: "/swipe", label: "Swipe", Icon: Vote },
    { href: "/spin", label: "Spin", Icon: Dices },
];

export default function NavBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50" aria-label="Primary">
            {/* Outer container with fixed height + safe area padding */}
            <div className="mx-auto w-full">
                <div
                    className="h-[var(--nav-h)] backdrop-blur-sm"
                    style={{
                        background: "linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,.18))",
                        boxShadow: "0 -2px 0 -1px var(--color-brass), 0 10px 30px rgba(0,0,0,.35)",
                    }}
                >
                    <ul className="grid h-full grid-cols-2 place-items-center">
                        {items.map(({ href, label, Icon }) => {
                            const active =
                                pathname === href || (href !== "/" && pathname.startsWith(href));
                            return (
                                <li key={href}>
                                    <Link href={href} aria-label={label} className="grid place-items-center">
                                        <button
                                            className="grid h-12 w-12 place-items-center rounded-2xl transition-all"
                                            style={{
                                                backgroundColor: "var(--color-secondary)",
                                                boxShadow: active
                                                    ? `0 0 0 2px var(--color-gold) inset, 0 0 16px rgba(0,0,0,.25)`
                                                    : `inset 0 0 0 1px var(--color-brass), 0 0 12px rgba(0,0,0,.2)`,
                                            }}
                                        >
                                            <Icon
                                                className="h-6 w-6"
                                                color="var(--color-gold)"
                                                style={{ filter: "drop-shadow(0 0 6px rgba(210,177,95,.4))" }}
                                            />
                                            <span className="sr-only">{label}</span>
                                        </button>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
