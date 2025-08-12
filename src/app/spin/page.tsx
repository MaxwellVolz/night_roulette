"use client";

import { useSelections } from "@/store/selections";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import Wheel from "@/components/Wheel";

/* ---------- Scene bits ---------- */

function Ball({ idx }: { idx: number }) {
    return (
        <RigidBody
            colliders="ball"
            restitution={0.65}
            friction={0.6}
            canSleep
            ccd
            position={[
                (Math.random() - 0.5) * 10,
                20 + idx * 0.3,
                (Math.random() - 0.5) * 10,
            ]}
        >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[1, 32, 16]} />
                <meshStandardMaterial metalness={0.5} roughness={0.4} color={0xd4af37} />
            </mesh>
        </RigidBody>
    );
}

function Floor() {
    return (
        <RigidBody type="fixed" colliders="trimesh">
            <mesh receiveShadow position={[0, -0.25, 0]}>
                <boxGeometry args={[20, 0.5, 20]} />
                <meshStandardMaterial color={0x222222} roughness={0.9} />
            </mesh>
        </RigidBody>
    );
}

/* ---------- Scene content ---------- */

function SceneContent() {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={3} castShadow />

            <Physics gravity={[0, -9.81, 0]} debug>
                <Floor />

                {/* Use the GLB's geometry as the collider directly */}
                {/* If the wheel is STATIC: keep type="fixed" + colliders="trimesh" */}
                {/* If the wheel MOVES: change to type="dynamic" + colliders="hull" */}
                <RigidBody type="fixed" colliders="trimesh">
                    <Wheel />
                </RigidBody>

                {Array.from({ length: 20 }).map((_, i) => (
                    <Ball key={i} idx={i} />
                ))}
            </Physics>

            <Environment preset="city" />
            <OrbitControls
                enableDamping
                minDistance={10}
                maxDistance={50}
                target={[0, 0, 0]}
            />
        </>
    );
}

/* ---------- Page ---------- */

export default function SpinPage() {
    const likes = useSelections((s) => s.likes);
    const removeLike = useSelections((s) => s.removeLike);
    const all = useMemo(() => Object.values(likes).flat(), [likes]);
    const [resultIdx, setResultIdx] = useState<number | null>(null);
    const canSpin = all.length >= 1;

    return (
        <div className="flex h-full flex-col">
            <header className="mb-4 mt-2">
                <h1 className="text-xl font-semibold">Spin</h1>
                <p className="text-sm text-zinc-300">
                    Liked options: <span className="font-semibold">{all.length}</span>
                </p>
            </header>

            <div className="flex-1">
                <div className="grid gap-3">
                    {all.map((c, i) => (
                        <div
                            key={`${c.category}:${c.id}`}
                            className="relative rounded-xl p-3"
                            style={{
                                backgroundColor: "var(--color-primary)",
                                boxShadow: "inset 0 0 0 1px var(--color-brass)",
                                outline: resultIdx === i ? `2px solid var(--color-gold)` : "none",
                            }}
                        >
                            <button
                                aria-label="Remove from liked"
                                onClick={() => {
                                    removeLike(c.category, c.id);
                                    setResultIdx((prev) =>
                                        prev == null ? prev : i === prev ? null : i < prev ? prev - 1 : prev
                                    );
                                }}
                                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md transition-opacity hover:opacity-90"
                                style={{
                                    backgroundColor: "var(--color-secondary)",
                                    boxShadow: "inset 0 0 0 1px var(--color-brass)",
                                }}
                            >
                                <X className="h-4 w-4" color="var(--color-gold)" />
                            </button>

                            <div className="text-sm text-zinc-300">{c.category.toUpperCase()}</div>
                            <div className="text-base font-semibold">{c.title}</div>
                            {c.subtitle && <div className="text-sm text-zinc-400">{c.subtitle}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full max-w-[560px] aspect-square overflow-hidden self-center">
                <Canvas
                    shadows
                    gl={{ antialias: true, alpha: true }}
                    onCreated={({ gl, camera }) => {
                        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                        gl.toneMapping = THREE.ACESFilmicToneMapping;
                        camera.position.set(0, 30, 30);
                        (camera as THREE.PerspectiveCamera).lookAt(0, 0, 0);
                    }}
                >
                    <SceneContent />
                </Canvas>
            </div>

            <footer className="mt-4 flex items-center gap-3">
                <button
                    disabled={!canSpin}
                    className="h-12 flex-1 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        color: "var(--color-secondary)",
                        backgroundColor: "var(--color-gold)",
                        boxShadow: "0 6px 18px rgba(210,177,95,.35)",
                    }}
                    onClick={() => {
                        if (!canSpin) return;
                        const idx = Math.floor(Math.random() * all.length);
                        setResultIdx(idx);
                    }}
                >
                    Spin
                </button>
            </footer>
        </div>
    );
}

/* Preload GLB to avoid first-frame hitch */
useGLTF.preload("/models/roulette_wheel.glb");
