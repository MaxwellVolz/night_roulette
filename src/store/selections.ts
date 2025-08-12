"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Choice = { id: string; category: string; title: string; subtitle?: string; image?: string; };

type SelectionsState = {
  likes: Record<string, Choice[]>;
  passes: Record<string, Choice[]>;
  addLike: (category: string, c: Choice) => void;
  addPass: (category: string, c: Choice) => void;
  removeLike: (category: string, id: string) => void; // <-- add
  clearCategory: (category: string) => void;
  allLikes: () => Choice[];
};

const dedupPush = (arr: Choice[], c: Choice) => (arr.find(x => x.id === c.id) ? arr : [...arr, c]);

export const useSelections = create<SelectionsState>()(
  persist(
    (set, get) => ({
      likes: {},
      passes: {},
      addLike: (category, c) =>
        set(state => ({
          likes: { ...state.likes, [category]: dedupPush(state.likes[category] ?? [], c) },
          passes: { ...state.passes, [category]: (state.passes[category] ?? []).filter(x => x.id !== c.id) },
        })),
      addPass: (category, c) =>
        set(state => ({
          passes: { ...state.passes, [category]: dedupPush(state.passes[category] ?? [], c) },
          likes: { ...state.likes, [category]: (state.likes[category] ?? []).filter(x => x.id !== c.id) },
        })),
      removeLike: (category, id) =>                      // <-- add
        set(state => ({
          likes: {
            ...state.likes,
            [category]: (state.likes[category] ?? []).filter(x => x.id !== id),
          },
        })),
      clearCategory: (category) =>
        set(state => ({
          likes: { ...state.likes, [category]: [] },
          passes: { ...state.passes, [category]: [] },
        })),
      allLikes: () => Object.values(get().likes).flat(),
    }),
    { name: "nr-selections-v1" }
  )
);