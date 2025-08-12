import { use } from "react";
import SwipeClient from "./SwipeClient";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category } = await params;
    const label = LABELS[category?.toLowerCase()] ?? category;
    return { title: `Swipe — ${label}` };
}

const LABELS: Record<string, string> = {
    bar: "Bar",
    show: "Show",
    workout: "Workout",
    random: "Random",
};

export default function Page({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category } = use(params); // <-- unwrap the Promise
    return <SwipeClient category={category} />;
}
