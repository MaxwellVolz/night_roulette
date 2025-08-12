"use client";

import { useSelections } from "@/store/selections";
import { useEffect, useRef, useMemo, useState } from "react";
import { X } from "lucide-react";

import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export default function SpinPage() {
    const likes = useSelections(s => s.likes);
    const removeLike = useSelections(s => s.removeLike);         // <-- use it
    const all = useMemo(() => Object.values(likes).flat(), [likes]);
    const [resultIdx, setResultIdx] = useState<number | null>(null);

    const mountRef = useRef<HTMLDivElement>(null);

    const canSpin = all.length >= 1;

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);

        const camera = new THREE.PerspectiveCamera(55, 1, 0.001, 5000);
        camera.position.set(0, 40, 40);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        // attach canvas
        const container = mountRef.current;
        container.appendChild(renderer.domElement);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";

        // size to parent
        const resize = () => {
            const w = container.clientWidth || 1;
            const h = container.clientHeight || 1;
            renderer.setSize(w, h, /*updateStyle*/ false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();

        // observe parent size changes
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 20;
        controls.maxDistance = 60;
        controls.enableDamping = true;
        controls.target.set(0, 0, 0);
        controls.update();

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 5);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Helpers
        scene.add(new THREE.GridHelper(10, 10));
        scene.add(new THREE.AxesHelper(5));
        scene.background = null;


        // Load GLTF
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/jsm/libs/draco/');
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load('/models/roulette_wheel.glb', (gltf) => {
            scene.add(gltf.scene);
        });

        // Animate
        let raf = 0;
        const animate = () => {
            controls.update();
            renderer.render(scene, camera);
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);

        // Cleanup
        return () => {
            ro.disconnect();
            cancelAnimationFrame(raf);
            controls.dispose();
            renderer.dispose();
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);


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
                            {/* remove button */}
                            <button
                                aria-label="Remove from liked"
                                onClick={() => {
                                    removeLike(c.category, c.id);
                                    setResultIdx(prev =>
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

            <div ref={mountRef} className="w-full" style={{ height: '460px', overflow: 'hidden' }} />

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
