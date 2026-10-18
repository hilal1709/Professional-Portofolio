"use client";

import { useSyncExternalStore } from "react";
import type { SkyTime } from "../SkyBackdrop";

/** Kunci babak — sama dengan `chapters.key` di database. */
export type SceneKey = "hero" | "about" | "journey" | "skills" | "projects" | "reel" | "experience" | "contact";

export type SceneMeta = { key: SceneKey; title: string; sky: SkyTime; anchor: string };

type State = { scenes: SceneMeta[]; active: number };

let state: State = { scenes: [], active: 0 };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const sceneStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
  setScenes(scenes: SceneMeta[]) {
    state = { scenes, active: Math.min(state.active, Math.max(0, scenes.length - 1)) };
    emit();
  },
  setActive(active: number) {
    if (active === state.active) return;
    state = { ...state, active };
    emit();
  },
};

const serverState: State = { scenes: [], active: 0 };

export function useSceneState() {
  return useSyncExternalStore(sceneStore.subscribe, sceneStore.get, () => serverState);
}

/** True bila babak `key` sedang aktif atau bersebelahan (dipakai untuk menjeda animasi & lazy-load). */
export function useSceneNear(key?: SceneKey, range = 1) {
  const { scenes, active } = useSceneState();
  if (!key || scenes.length === 0) return true;
  const i = scenes.findIndex((s) => s.key === key);
  return i === -1 || Math.abs(i - active) <= range;
}

/** Navigasi: minta panggung melompat ke babak tertentu. */
export const STORY_GOTO = "story:goto";
export function gotoScene(key: SceneKey) {
  window.dispatchEvent(new CustomEvent(STORY_GOTO, { detail: key }));
}

/** Peta anchor lama (#tentang, #kontak, …) ke kunci babak. */
export const ANCHORS: Record<string, SceneKey> = {
  halo: "hero",
  tentang: "about",
  perjalanan: "journey",
  skill: "skills",
  proyek: "projects",
  reel: "reel",
  pengalaman: "experience",
  kontak: "contact",
};
