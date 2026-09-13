import { GeoLocation, useBackendClient } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import { useAppTheme } from "@/ThemeContext";
import { OrbitControls, useProgress } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useIsFocused } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as THREE from "three";
import FlightTrajectory from "./FlightTrajectory";
import GlobeMarker, { geodeticToECEF, ServerLocation } from "./GlobeMarker";
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

function Loader() {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#fff" />
			<Text style={{ color: theme.colors.text, marginTop: 10 }}>
				Загрузка карты...
			</Text>
		</View>
	);
}

export default function InteractiveServerMap() {
	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const isActive = useIsFocused();
	const { progress, active } = useProgress();
	const isLoaded = !active && progress === 100;

	const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(true);
	const [isCameraMoving, setIsCameraMoving] = useState(false);
	const [userGeo, setUserGeo] = useState<GeoLocation | null>(null);

	const { getUserLastGeo } = useBackendClient();
	const { fetchServers } = useServers();
	const { getSubscription } = useBackendClient();

	useEffect(() => {
		if (aircraftRef.current) {
			aircraftRef.current.visible = isActive;
		}
		if (earthRef.current) {
			earthRef.current.visible = isActive;
		}
		setIsReady(isActive);
	}, [isActive]);

	useEffect(() => {
		SecureStore.getItemAsync("USER_ID").then((userId) => {
			if (userId) {
				getUserLastGeo(userId)
					.then((response) => {
						setUserGeo(response?.response);
					})
					.catch((e) => {
						console.error(e);
					});
			}
		});
	}, [userGeo]);

	const serverData: ServerLocation[] = [
		{ id: "nl", lat: 52.3676, lon: 4.9041, name: "Нидерланды" },
		{ id: "de", lat: 52.52, lon: 13.405, name: "Германия" },
		{ id: "rs", lat: 44.7866, lon: 20.4489, name: "Сербия" },
		{ id: "us", lat: 40.6892, lon: -74.0445, name: "US" },
	];

	let A = null;
	let B = null;
	if (userGeo) {
		A = new THREE.Vector3(
			...geodeticToECEF(userGeo.latitude, userGeo.longtitude, 7.22),
		);
		B = new THREE.Vector3(
			...geodeticToECEF(serverData[3].lat, serverData[3].lon, 7.22),
		);
	} else {
		A = new THREE.Vector3(
			...geodeticToECEF(serverData[0].lat, serverData[0].lon, 7.22),
		);
		B = new THREE.Vector3(
			...geodeticToECEF(serverData[3].lat, serverData[3].lon, 7.22),
		);
	}

	const optimalSegments = useMemo(() => {
		const distance = A.distanceTo(B);

		const calculated = Math.floor(distance * 40);

		return Math.min(Math.max(calculated, 40), 150);
	}, [A, B]);

	return (
		<View style={styles.content}>
			<Canvas camera={{ position: [-16, 0, 0], fov: 65 }}>
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
							scale: 0.04,
						}}
					/>
					{A && B && (
						<FlightTrajectory
							A={A}
							B={B}
							height={2.5}
							aircraftRef={aircraftRef}
							minAircraftScale={0.02}
							maxAircraftScale={0.05}
							segments={optimalSegments}
							onAnimationStateChange={setIsCameraMoving}
						/>
					)}
				</group>
				<OrbitControls enableRotate={!isCameraMoving} enableZoom={false} />
			</Canvas>
			{!isLoaded && (
				<View style={StyleSheet.absoluteFill} pointerEvents="none">
					<Loader />
				</View>
			)}
		</View>
	);
}

export const styles = StyleSheet.create({
	content: {
		width: 350,
		height: 350,
	},
});
