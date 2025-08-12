"use client";

import { useSelections } from "@/store/selections";
import { useEffect, useRef, useMemo, useState } from "react";
import { X } from "lucide-react";

import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

type BodyRef = {
    mesh: THREE.Mesh;
    body: any; // RAPIER.RigidBody
};

function makeSphere(radius = 0.25, color = 0xd4af37) {
    const geo = new THREE.SphereGeometry(radius, 32, 16);
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
}


export default function SpinPage() {
    const likes = useSelections(s => s.likes);
    const removeLike = useSelections(s => s.removeLike);         // <-- use it
    const all = useMemo(() => Object.values(likes).flat(), [likes]);
    const [resultIdx, setResultIdx] = useState<number | null>(null);

    const mountRef = useRef<HTMLDivElement>(null);

    const canSpin = all.length >= 1;

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = null; // keep your transparent bg if you enabled alpha
        const camera = new THREE.PerspectiveCamera(55, 1, 0.001, 5000);
        camera.position.set(0, 5, 20);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const container = mountRef.current;
        container.appendChild(renderer.domElement);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";

        const resize = () => {
            const w = container.clientWidth || 1;
            const h = container.clientHeight || 1;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 3);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Helpers
        scene.add(new THREE.GridHelper(10, 10));
        scene.add(new THREE.AxesHelper(5));

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 10;
        controls.maxDistance = 50;
        controls.enableDamping = true;
        controls.target.set(0, 0, 0);
        controls.update();

        // Load GLTF (static visual mesh for now — we’ll add physics balls)
        const dracoLoader = new DRACOLoader().setDecoderPath('/jsm/libs/draco/');
        const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
        loader.load('/models/roulette_wheel.glb', (gltf) => {
            scene.add(gltf.scene);
        });

        // ======== RAPIER PHYSICS ========
        let RAPIER: any;
        let world: any;
        const bodies: BodyRef[] = [];

        // floor collider (static)
        const addFloor = () => {
            // visual
            const floor = new THREE.Mesh(
                new THREE.BoxGeometry(100, 2, 100),
                new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0.0 })
            );
            floor.position.set(0, -0.25, 0);
            floor.receiveShadow = true;
            scene.add(floor);

            // physics
            const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.25, 0);
            const rb = world.createRigidBody(rbDesc);
            const colDesc = RAPIER.ColliderDesc.cuboid(100, 2, 100);
            world.createCollider(colDesc, rb);
        };

        const addBall = (pos = new THREE.Vector3(0, 50, 0), radius = 50) => {
            const mesh = makeSphere(radius);
            mesh.position.copy(pos);
            scene.add(mesh);

            const rbDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(pos.x, pos.y, pos.z)
                .setCanSleep(true)
                .setCcdEnabled(true);
            const rb = world.createRigidBody(rbDesc);

            const colDesc = RAPIER.ColliderDesc.ball(radius).setRestitution(0.65).setFriction(0.6);
            world.createCollider(colDesc, rb);

            bodies.push({ mesh, body: rb });
        };

        let physicsReady = false;

        (async () => {
            const R = await import('@dimforge/rapier3d-compat');
            RAPIER = R.default;
            await RAPIER.init();

            world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

            addFloor();
            // spawn a few balls to prove it works
            for (let i = 0; i < 6; i++) {
                addBall(new THREE.Vector3((Math.random() - 0.5) * 20, 50 + i * 0.5, (Math.random() - 0.5) * 20), 5);
            }
            physicsReady = true;

            (window as any).__kickBall = () => {
                if (!physicsReady) return;
                if (bodies[0]) {
                    bodies[0].body.applyImpulse({ x: 4 * (Math.random() - 0.5), y: 2.0, z: 4 * (Math.random() - 0.5) }, true);
                }
            };
        })();

        // Animate
        let raf = 0;
        const animate = () => {
            controls.update();

            if (physicsReady) {
                world.timestep = 1 / 60; // consistent stepping
                world.step();

                // sync physics → three
                for (const { mesh, body } of bodies) {
                    const t = body.translation();
                    const r = body.rotation(); // {x,y,z,w}
                    mesh.position.set(t.x, t.y, t.z);
                    mesh.quaternion.set(r.x, r.y, r.z, r.w);
                }
            }

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
            // Let GC handle Rapier; explicit world.free() is not required in compat build,
            // but if you import core rapier you can free() here.
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
                                    (window as any).__kickBall?.();
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
