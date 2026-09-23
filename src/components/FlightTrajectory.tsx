import { extend, ThreeElement, useFrame } from "@react-three/fiber/native";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

const dummyGlobal = new THREE.Object3D();
const worldCurrentPoint = new THREE.Vector3();
const worldNextPoint = new THREE.Vector3();
const worldQuat = new THREE.Quaternion();
const inverseEarthQuat = new THREE.Quaternion();
const currentPoint = new THREE.Vector3();
const nextPoint = new THREE.Vector3();
const cameraTargetPos = new THREE.Vector3();

declare module "@react-three/fiber" {
	interface ThreeElements {
		meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
		meshLineMaterial: Partial<ThreeElement<typeof MeshLineMaterial>>;
	}
}

interface FlightTrajectoryProps {
	A: THREE.Vector3;
	B: THREE.Vector3;
	height: number;
	aircraftRef: RefObject<THREE.Group | THREE.Object3D | null>;
	segments?: number;
	initialCameraPosRef: React.RefObject<THREE.Vector3 | null>;
	onAnimationStateChange?: (isCameraBusy: boolean) => void;
	animationVisible?: (complete: boolean) => void;
}

export default function FlightTrajectory({
	A,
	B,
	height,
	aircraftRef,
	segments = 50,
	initialCameraPosRef,
	onAnimationStateChange,
	animationVisible,
}: FlightTrajectoryProps) {
	const arcGeom = useMemo(() => {
		const surfaceRadius = Math.min(A.length(), B.length());
		const a = A.clone().normalize();
		const b = B.clone().normalize();
		const omega = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))); // central angle
		const sinOmega = Math.sin(omega);

		// Arc lift scales with the great-circle angle (short hops hug the surface)
		// and is capped well under the radius so the path reads as a flight instead
		// of a huge jump over the globe.
		const peakLift = Math.min(height, surfaceRadius * 0.22) * (omega / Math.PI);

		const samples = 64;
		const arcPoints: THREE.Vector3[] = [];
		for (let i = 0; i <= samples; i++) {
			const t = i / samples;

			let dir: THREE.Vector3;
			if (sinOmega < 1e-4) {
				dir = a.clone().lerp(b, t).normalize();
			} else {
				const w1 = Math.sin((1 - t) * omega) / sinOmega;
				const w2 = Math.sin(t * omega) / sinOmega;
				dir = a
					.clone()
					.multiplyScalar(w1)
					.add(b.clone().multiplyScalar(w2))
					.normalize();
			}

			const altitude = surfaceRadius + peakLift * Math.sin(Math.PI * t);
			arcPoints.push(dir.multiplyScalar(altitude));
		}

		const curve = new THREE.CatmullRomCurve3(arcPoints, false, "centripetal");

		// Frame the entire arc: aim at the centroid of the two endpoints + apex, and
		// pull the camera back in proportion to the span so long hops fully fit.
		const apex = curve.getPoint(0.5);
		const aim = apex.clone().add(A).add(B).multiplyScalar(1 / 3);
		const cameraDistance = surfaceRadius * 0.9 + peakLift * 3.0;

		return { curve, aim, cameraDistance };
	}, [A, B, height]);

	const curve = arcGeom.curve;

	const points = useMemo(() => {
		return curve.getPoints(segments);
	}, [curve, segments]);

	const flatPoints = useMemo(() => {
		return points.flatMap((p) => [p.x, p.y, p.z]);
	}, [points]);

	const initialPoints = useMemo(() => {
		const arr = [];
		for (let i = 0; i < segments; i++) {
			arr.push(A.x, A.y, A.z);
		}
		return arr;
	}, [A, segments]);

	const lineGeom = useRef<any>(null);
	const trajectoryDrawn = useRef(false);
	const flightProgressRef = useRef(0);
	const drawProgressRef = useRef(0);
	const lastDrawnIndexRef = useRef(-1);

	const CAMERA_FOLLOW_SPEED = 0.05;
	const CAMERA_RETURN_SPEED = 0.03;
	const DRAW_SPEED = 0.2;
	const FLIGHT_SPEED = 0.15;

	const worldUp = new THREE.Vector3();
	const middleAB = new THREE.Vector3();

	useEffect(() => {
		if (lineGeom.current) {
			lineGeom.current.setPoints(initialPoints);
		}
		trajectoryDrawn.current = false;
		drawProgressRef.current = 0;
		flightProgressRef.current = 0;
		lastDrawnIndexRef.current = -1;
		// Re-arm capture so an interrupted previous flight can't leave a stale
		// "home" position.
		initialCameraPosRef.current = null;
		if (aircraftRef.current) {
			aircraftRef.current.visible = false;
		}
		onAnimationStateChange?.(false);
	}, [A, B, initialPoints]);

	useFrame((state) => {
		// Capture the pre-flight camera position exactly once (on mount the ref is
		// null; the return phase clears it for the next flight). Cloning + writing it
		// every frame both allocated and let the moving camera overwrite the target.
		if (initialCameraPosRef.current == null) {
			initialCameraPosRef.current = state.camera.position.clone();
		}
	});

	useFrame((state, delta) => {
		if (!trajectoryDrawn.current) {
			if (aircraftRef.current) aircraftRef.current.visible = false;

			if (drawProgressRef.current < 1.0 && lineGeom.current) {
				if (aircraftRef.current) {
					const aircraft = aircraftRef.current;
					const earth = aircraft.parent;

					middleAB.copy(arcGeom.aim);

					if (earth) {
						earth.updateWorldMatrix(true, false);
						earth.localToWorld(middleAB);
					}

					worldUp.copy(middleAB).normalize();

					cameraTargetPos
						.copy(worldUp)
						.multiplyScalar(arcGeom.cameraDistance)
						.add(middleAB);

					state.camera.position.lerp(cameraTargetPos, CAMERA_RETURN_SPEED);
					state.camera.lookAt(middleAB);
				}

				drawProgressRef.current += delta * DRAW_SPEED;
				const p = Math.min(drawProgressRef.current, 1.0);

				const easedProgress = Math.sin((p * Math.PI) / 2);

				const targetPointIndex = Math.floor(easedProgress * (segments - 1));

				// Only rebuild the mesh-line when the revealed segment actually changes.
				// Rebuilding every frame reallocated ~7 typed arrays + re-ran bounds for
				// identical data and was the main cause of the FPS drop.
				if (targetPointIndex !== lastDrawnIndexRef.current) {
					lastDrawnIndexRef.current = targetPointIndex;
					const sliceEnd = (targetPointIndex + 1) * 3;

					const visibleChunk = flatPoints.slice(0, sliceEnd);

					const lastX = flatPoints[sliceEnd - 3];
					const lastY = flatPoints[sliceEnd - 2];
					const lastZ = flatPoints[sliceEnd - 1];

					const remainingCount = segments - (targetPointIndex + 1);
					for (let i = 0; i < remainingCount; i++) {
						visibleChunk.push(lastX, lastY, lastZ);
					}

					lineGeom.current.setPoints(visibleChunk);
				}
			} else {
				trajectoryDrawn.current = true;
				flightProgressRef.current = 0;
				onAnimationStateChange?.(true);
			}
		} else if (trajectoryDrawn.current && aircraftRef.current) {
			const aircraft = aircraftRef.current;
			const earth = aircraft.parent;

			if (earth && flightProgressRef.current < 1.0) {
				aircraft.visible = true;

				flightProgressRef.current += delta * FLIGHT_SPEED;
				const p = Math.min(flightProgressRef.current, 1.0);

				curve.getPointAt(p, currentPoint);
				const nextP = Math.min(p + 0.01, 1.0);
				curve.getPointAt(nextP, nextPoint);

				worldCurrentPoint.copy(currentPoint);
				worldNextPoint.copy(nextPoint);
				earth.localToWorld(worldCurrentPoint);
				earth.localToWorld(worldNextPoint);

				dummyGlobal.position.copy(worldCurrentPoint);

				worldUp.subVectors(worldCurrentPoint, earth.position).normalize();
				dummyGlobal.up.copy(worldUp);

				if (p < 1.0) {
					dummyGlobal.lookAt(worldNextPoint);
				}

				aircraft.position.copy(currentPoint);

				dummyGlobal.getWorldQuaternion(worldQuat);
				earth.getWorldQuaternion(inverseEarthQuat).invert();
				aircraft.quaternion.copy(inverseEarthQuat).multiply(worldQuat);

				// Chase from a distance that scales with the arc so long hops (and
				// their apex) stay in frame, instead of a fixed pull-back.
				const chaseDistance = Math.max(5.5, arcGeom.cameraDistance * 0.7);

				cameraTargetPos
					.copy(worldUp)
					.multiplyScalar(chaseDistance)
					.add(worldCurrentPoint);

				state.camera.position.lerp(cameraTargetPos, CAMERA_FOLLOW_SPEED);

				state.camera.lookAt(worldCurrentPoint);
			} else if (
				flightProgressRef.current >= 1.0 &&
				initialCameraPosRef.current
			) {
				const aircraft = aircraftRef.current;
				aircraft.visible = false;

				state.camera.position.lerp(
					initialCameraPosRef.current,
					CAMERA_RETURN_SPEED,
				);
				state.camera.lookAt(0, 0, 0);

				if (
					state.camera.position.distanceTo(initialCameraPosRef.current) <= 0.01
				) {
					state.camera.position.copy(initialCameraPosRef.current);
					state.camera.lookAt(0, 0, 0);
					initialCameraPosRef.current = null;

					onAnimationStateChange?.(false);
					animationVisible?.(false);
				}
			}
		}
	});

	return (
		<mesh>
			<meshLineGeometry ref={lineGeom} points={initialPoints} />
			<meshLineMaterial lineWidth={0.125} color={new THREE.Color("#ff0000")} />
		</mesh>
	);
}
