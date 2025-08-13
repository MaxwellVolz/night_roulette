"use client";

import { useSelections } from "@/store/selections";
import { useMemo, useState, useRef } from "react";
import { X } from "lucide-react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Text } from "@react-three/drei";
import { Physics, RigidBody, interactionGroups } from "@react-three/rapier";
import Inner from "@/components/Inner";
import Outer from "@/components/Outer";

function FlatRingText({
    labels,
    radius = 8,
    y = 3,
    fontSize = 0.1,
    inward = true,
    color = "#fff",
}: {
    labels: string[];
    radius?: number;
    y?: number;
    fontSize?: number;
    inward?: boolean;
    color?: string;
}) {
    const n = labels.length || 1;
    return (
        <>
            {labels.map((txt, i) => {
                const theta = (i / n) * Math.PI * 2;
                const x = Math.cos(theta) * radius;
                const z = Math.sin(theta) * radius;
                const rotY = inward ? theta + Math.PI : theta;

                return (
                    <group key={i} position={[x, y, z]} rotation={[0, 0 - rotY, 0]}>
                        <Text
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={fontSize}
                            color={color}
                            anchorX={inward ? "right" : "left"}
                            anchorY="middle"
                            outlineWidth={0.2 * fontSize}
                            outlineColor="black"
                            curveRadius={-40}
                        >
                            {txt}
                        </Text>
                    </group>
                );
            })}
        </>
    );
}

function Label3D({
    children,
    position,
}: {
    children: string;
    position: [number, number, number];
}) {
    return (
        <Text
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
        >
            {children}
        </Text>
    );
}

function Ball({ idx }: { idx: number }) {
    return (
        <RigidBody
            colliders="ball"
            restitution={0.65}
            friction={0.3}
            mass={0.2}
            ccd
            collisionGroups={interactionGroups(0b01, 0b11)} // balls collide with wheel & rim
            position={[
                (Math.random() - 0.5) * 1,
                1 + idx * 0.3,
                (Math.random() - 0.5) * 1,
            ]}
        >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.03, 32, 16]} />
                <meshStandardMaterial
                    metalness={0.5}
                    roughness={0.4}
                    color={0xd4af37}
                />
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

function SceneContent({ labels }: { labels: string[] }) {
    const wheelRef = useRef<RigidBody>(null);

    const spinWheel = (impulseY = 2500) => {
        const rb = wheelRef.current;
        if (!rb) return;
        rb.applyTorqueImpulse({ x: 0, y: impulseY, z: 0 }, true);
        rb.wakeUp();
    };

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={3} castShadow />

            <Physics gravity={[0, -9.81, 0]} debug>
                <Floor />

                {/* Inner wheel with complex hull collider */}
                <RigidBody
                    ref={wheelRef}
                    type="dynamic"
                    colliders="hull"
                    ccd
                    canSleep
                    angularDamping={0.18}
                    linearDamping={1}
                    friction={0.9}
                    restitution={0.1}
                    enabledTranslations={[false, false, false]}
                    enabledRotations={[false, true, false]}
                    position={[0, 0.05, 0]}
                >
                    <group
                        colliders={false} // prevent labels/text from generating colliders
                        onClick={(e) => {
                            e.stopPropagation();
                            const dir = e.altKey ? -1 : 1;
                            const rb = wheelRef.current;
                            if (!rb) return;

                            // Guarantee visible rotation and still have physics impulse
                            rb.setAngvel({ x: 0, y: .15 * dir, z: 0 }, true);
                            spinWheel(.15 * dir);
                        }}
                    >
                        <Inner />
                    </group>
                </RigidBody>

                {/* Rim is fixed and ignores raycasts */}
                <RigidBody
                    type="fixed"
                    colliders="trimesh"
                >
                    <group raycast={() => null}>
                        <Outer />
                    </group>
                </RigidBody>

                {Array.from({ length: 5 }).map((_, i) => (
                    <Ball key={i} idx={i} />
                ))}
            </Physics>

            <Environment preset="city" />
            <OrbitControls
                enableDamping
                minDistance={2}
                maxDistance={10}
                target={[0, 0, 0]}
            />
        </>
    );
}

export default function SpinPage() {
    const likes = useSelections((s) => s.likes);
    const removeLike = useSelections((s) => s.removeLike);
    const all = useMemo(() => Object.values(likes).flat(), [likes]);
    const [resultIdx, setResultIdx] = useState<number | null>(null);
    const canSpin = all.length >= 1;

    const SLOTS = 8;
    const rawLabels = useMemo(
        () => all.map((c: any) => c.title ?? String(c.id)),
        [all]
    );

    const labels = useMemo(() => {
        if (rawLabels.length === 0) return Array(SLOTS).fill("—");
        if (rawLabels.length === SLOTS) return rawLabels;
        if (rawLabels.length > SLOTS) return rawLabels.slice(0, SLOTS);
        const out: string[] = [];
        for (let i = 0; i < SLOTS; i++)
            out.push(rawLabels[i % rawLabels.length]);
        return out;
    }, [rawLabels]);

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
                                outline:
                                    resultIdx === i
                                        ? `2px solid var(--color-gold)`
                                        : "none",
                            }}
                        >
                            <button
                                aria-label="Remove from liked"
                                onClick={() => {
                                    removeLike(c.category, c.id);
                                    setResultIdx((prev) =>
                                        prev == null
                                            ? prev
                                            : i === prev
                                                ? null
                                                : i < prev
                                                    ? prev - 1
                                                    : prev
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

                            <div className="text-sm text-zinc-300">
                                {c.category.toUpperCase()}
                            </div>
                            <div className="text-base font-semibold">{c.title}</div>
                            {c.subtitle && (
                                <div className="text-sm text-zinc-400">{c.subtitle}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative w-full max-w-[560px] aspect-square overflow-hidden self-center">
                <Canvas
                    shadows
                    gl={{ antialias: true, alpha: true }}
                    onCreated={({ gl, camera }) => {
                        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                        gl.toneMapping = THREE.ACESFilmicToneMapping;
                        camera.position.set(0, 2, 2);
                        (camera as THREE.PerspectiveCamera).lookAt(0, 0, 0);
                    }}
                >
                    <SceneContent labels={labels} />
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

useGLTF.preload("/models/roulette_wheel.glb");
