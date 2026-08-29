import { OrbitControls } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useIsFocused } from "expo-router";
import { RefObject, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";
import FlightTrajectory from "./FlightTrajectory";
import GlobeMarker, {
	ActiveLabel,
	geodeticToECEF,
	ServerLocation,
} from "./GlobeMarker";
import { Model } from "./Model";

export function Animate({ ref }: { ref: RefObject<THREE.Object3D | null> }) {
	useFrame((state, delta) => {
		{
			if (ref.current) {
				ref.current.rotation.y -= delta * 0.1;
			}
		}
	});

	return null;
}

export default function InteractiveServerMap() {
	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const germany = earthRef.current?.getObjectByName("Germany")?.position;
	const netherlands =
		earthRef.current?.getObjectByName("Netherlands")?.position;
	const serbia = earthRef.current?.getObjectByName("Serbia")?.position;

	const isActive = useIsFocused();
	const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
	const [currentLabel, setCurrentLabel] = useState<ActiveLabel | null>(null);

	useEffect(() => {
		if (!isActive) {
			aircraftRef.current?.clear();
			earthRef.current?.clear();
			aircraftRef.current = null;
			earthRef.current = null;
			setActiveLocationId(null);
			setCurrentLabel(null);
		}
	}, [isActive]);

	const serverData: ServerLocation[] = [
		{ id: "nl", lat: 52.3676, lon: 4.9041, name: "Нидерланды" },
		{ id: "de", lat: 52.52, lon: 13.405, name: "Германия" },
		{ id: "rs", lat: 44.7866, lon: 20.4489, name: "Сербия" },
		{ id: "us", lat: 40.6892, lon: -74.0445, name: "US" },
	];

	const A = new THREE.Vector3(
		...geodeticToECEF(serverData[0].lat, serverData[0].lon, 7.22),
	);
	const B = new THREE.Vector3(
		...geodeticToECEF(serverData[3].lat, serverData[3].lon, 7.22),
	);

	return (
		<View style={styles.content}>
			<Canvas camera={{ position: [-14, 0, 0], fov: 65 }}>
				<ambientLight intensity={0.7} />
				<directionalLight color="white" position={[0, 14, 0]} intensity={3} />
				<Animate ref={earthRef} />
				<group ref={earthRef}>
					<Model
						model={"earth"}
						props={{
							position: [0, 0, 0],
						}}
					/>
					{serverData.map((loc) => (
						<GlobeMarker
							key={loc.id}
							id={loc.id}
							lat={loc.lat}
							lng={loc.lon}
							activeId={activeLocationId}
							onSelect={setActiveLocationId}
						/>
					))}
					<Model
						ref={aircraftRef}
						model={"aircraft"}
						props={{
							scale: 0.02,
						}}
					/>
					<FlightTrajectory
						A={A}
						B={B}
						height={3}
						aircraftRef={aircraftRef}
						minAircraftScale={0.02}
						maxAircraftScale={0.05}
						segments={50}
					/>
				</group>
				<OrbitControls enableRotate={true} enableZoom={true} />
			</Canvas>
		</View>
	);
}

export const styles = StyleSheet.create({
	content: {
		width: 350,
		height: 350,
	},
});
