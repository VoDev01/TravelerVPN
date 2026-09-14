import { extend, ThreeElement, useFrame } from "@react-three/fiber/native";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { RefObject, useRef } from "react";
import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

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
	minAircraftScale: number;
	maxAircraftScale: number;
	segments?: number;
}

export default function FlightTrajectory({
	A,
	B,
	height,
	aircraftRef,
	minAircraftScale,
	maxAircraftScale,
	segments = 50,
}: FlightTrajectoryProps) {
	const midX = (A.x + B.x) / 2;
	const midZ = (A.z + B.z) / 2;

	const maxBaseY = Math.max(A.y, B.y);
	const midY = maxBaseY + height;

	const middle = new THREE.Vector3(midX, midY, midZ);

	const curve = new THREE.QuadraticBezierCurve3(A, middle, B);

	const points = curve.getPoints(segments);

	const lineGeom = useRef<MeshLineGeometry>(null);
	let i = 0;

	const initialPoints = [];
	for (let k = 0; k < points.length; k++) {
		initialPoints.push(points[i].x, points[i].y, points[i].z);
	}

	const currentIndexRef = useRef(0);
	const timeAccumulatorRef = useRef(0);
	const trajectoryDrawn = useRef(false);

	const INTERVAL = 0.018;

	useFrame((state, delta) => {
		timeAccumulatorRef.current += delta;

		if (timeAccumulatorRef.current >= INTERVAL) {
			timeAccumulatorRef.current = 0;

			const currentIndex = currentIndexRef.current;
			const currentPoint = points[currentIndex];

			if (
				currentIndex < points.length &&
				lineGeom.current &&
				!trajectoryDrawn.current
			) {
				lineGeom.current.advance(currentPoint);

				currentIndexRef.current += 1;
			} else if (currentIndex >= points.length) {
				trajectoryDrawn.current = true;
				currentIndexRef.current = 0;
			}
			if (trajectoryDrawn.current) {
				if (currentIndex < points.length) {
					aircraftRef.current?.position.set(
						currentPoint.x,
						currentPoint.y,
						currentPoint.z,
					);

					const nextPoint = points[currentIndex + 1];
					if (nextPoint) {
						aircraftRef.current?.lookAt(nextPoint);
					}

					const currentHeight = currentPoint.y;

					const heightRatio = Math.min(Math.max(currentHeight / height, 0), 1);

					const currentScale =
						minAircraftScale +
						(maxAircraftScale - minAircraftScale) * heightRatio;

					aircraftRef.current?.scale.setScalar(currentScale);

					currentIndexRef.current += 1;
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
