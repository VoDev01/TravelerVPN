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
	const curve = useMemo(() => {
		const midX = (A.x + B.x) / 2;
		const midZ = (A.z + B.z) / 2;
		const maxBaseY = Math.max(A.y, B.y);
		const midY = maxBaseY + height;

		const middle = new THREE.Vector3(midX, midY, midZ);
		return new THREE.QuadraticBezierCurve3(A, middle, B);
	}, [A, B, height]);

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

	const CAMERA_FOLLOW_SPEED = 0.05;
	const CAMERA_RETURN_SPEED = 0.03;
	const DRAW_SPEED = 0.2;
	const FLIGHT_SPEED = 0.15;
	const cameraOffsetDistance = 6.0;

	const center = new THREE.Vector3(0, 0, 0);
	const worldUp = new THREE.Vector3();
	const middleAB = new THREE.Vector3();

	useEffect(() => {
		if (lineGeom.current) {
			lineGeom.current.setPoints(initialPoints);
		}
		trajectoryDrawn.current = false;
		drawProgressRef.current = 0;
		flightProgressRef.current = 0;
		if (aircraftRef.current) {
			aircraftRef.current.visible = false;
		}
		onAnimationStateChange?.(false);
	}, [A, B, initialPoints]);

	useFrame((state) => {
		initialCameraPosRef.current = state.camera.position.clone();
	});

	useFrame((state, delta) => {
		if (!trajectoryDrawn.current) {
			if (aircraftRef.current) aircraftRef.current.visible = false;

			if (drawProgressRef.current < 1.0 && lineGeom.current) {
				if (aircraftRef.current) {
					const aircraft = aircraftRef.current;
					const earth = aircraft.parent;
					const earthPos = earth?.position ?? center;

					middleAB.set(0, 0, 0).addVectors(A, B).multiplyScalar(0.5);

					const middleABUp = middleAB.clone().sub(earthPos).normalize();

					cameraTargetPos
						.copy(middleABUp)
						.multiplyScalar(cameraOffsetDistance)
						.add(middleAB);

					state.camera.position.lerp(cameraTargetPos, CAMERA_RETURN_SPEED);
					state.camera.lookAt(middleAB);
				}

				drawProgressRef.current += delta * DRAW_SPEED;
				const p = Math.min(drawProgressRef.current, 1.0);

				const easedProgress = Math.sin((p * Math.PI) / 2);

				const targetPointIndex = Math.floor(easedProgress * (segments - 1));
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

				cameraTargetPos
					.copy(worldUp)
					.multiplyScalar(cameraOffsetDistance)
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
