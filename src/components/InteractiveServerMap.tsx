import { GeoLocation, useBackendClient } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import { OrbitControls, useProgress } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useIsFocused } from "expo-router";
import { memo, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";
import FlightTrajectory from "./FlightTrajectory";
import GlobeMarker, { geodeticToECEF } from "./GlobeMarker";
import { Loader } from "./Loader";
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

interface ServerGeoLocation {
	id: number;
	location: GeoLocation;
}

function InteractiveServerMap({
	onSelectLocation,
	onServerConnectingId,
}: {
	onSelectLocation: (location: string) => void;
	onServerConnectingId: number | undefined;
}) {
	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const isActive = useIsFocused();
	const { progress } = useProgress();
	const isLoaded = progress === 100;
	const [isServersLoaded, setIsServersLoaded] = useState(false);

	const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
	const [isCameraMoving, setIsCameraMoving] = useState(false);
	const [isFlightPathDefined, setIsFlightPathDefined] = useState(false);

	const [serversLocations, setServersLocations] = useState<ServerGeoLocation[]>(
		[],
	);

	const [userGeo, setUserGeo] = useState<GeoLocation | null>(null);
	const [userId, setUserId] = useState("");

	const { getUserGeoFromIp } = useBackendClient();
	const { fetchServers } = useServers();

	useEffect(() => {
		getUserGeoFromIp()
			.then((response) => {
				setUserGeo(response?.response);
			})
			.catch((e) => {
				console.error(e);
			});
		fetchServers(userId)
			.then((servers) => {
				if (servers.length > 0) {
					const locationsByCity = new Map<string, ServerGeoLocation>();
					servers.forEach((server) => {
						locationsByCity.set(server.city, {
							id: server.id,
							location: {
								country: server.country,
								city: server.city,
								latitude: server.latitude,
								longitude: server.longitude,
							},
						});
					});
					setServersLocations([...locationsByCity.values()]);
					setIsServersLoaded(true);
				}
			})
			.catch((e) => {
				console.error(`Unable to load servers for InteractiveMap: ${e}`);
				setIsServersLoaded(false);
			});
	}, [userId]);

	const A = useMemo(() => new THREE.Vector3(), []);
	const B = useMemo(() => new THREE.Vector3(), []);

	const optimalSegments = (() => {
		const distance = A.distanceTo(B);
		const calculated = Math.floor(distance * 40);
		return Math.min(Math.max(calculated, 40), 150);
	})();

	useEffect(() => {
		const onServerConnecting = (id: number | undefined) => {
			if (serversLocations.length > 0 && id) {
				const server = serversLocations.find((server) => server.id === id);
				if (server && userGeo) {
					A.set(...geodeticToECEF(userGeo.latitude, userGeo.longitude, 7.22));
					B.set(
						...geodeticToECEF(
							server.location?.latitude,
							server.location?.longitude,
							7.22,
						),
					);
					setIsFlightPathDefined(true);
				}
			}
		};

		onServerConnecting(onServerConnectingId);
	}, [onServerConnectingId]);

	const renderServerLocation = (serverGeo: ServerGeoLocation) => {
		if (serverGeo.location) {
			return (
				<GlobeMarker
					key={serverGeo.id}
					id={serverGeo.location.city}
					lat={serverGeo.location.latitude}
					lon={serverGeo.location.longitude}
					activeId={activeLocationId}
					onSelect={(city: string) => {
						setActiveLocationId(city);
						onSelectLocation(city);
					}}
				/>
			);
		}
	};

	if (!isServersLoaded) {
		<Loader loaderText="Загрузка серверов..." />;
	}

	return (
		<View style={styles.content}>
			<Canvas
				frameloop={isActive ? "always" : "never"}
				gl={{ antialias: false, powerPreference: "high-performance" }}
				camera={{ position: [-16, 0, 0], fov: 65 }}>
				<ambientLight intensity={3} />
				<Animate ref={earthRef} />
				<group ref={earthRef}>
					<Model
						model={"earth"}
						props={{
							position: [0, 0, 0],
						}}
					/>
					{serversLocations.map((serverGeo) => renderServerLocation(serverGeo))}
					<Model
						ref={aircraftRef}
						model={"aircraft"}
						props={{
							scale: 0.04,
						}}
					/>
					{isFlightPathDefined && (
						<FlightTrajectory
							A={A}
							B={B}
							height={2.5}
							aircraftRef={aircraftRef}
							segments={optimalSegments}
							onAnimationStateChange={setIsCameraMoving}
							onAnimationComplete={setIsFlightPathDefined}
						/>
					)}
				</group>
				<OrbitControls enableRotate={!isCameraMoving} enableZoom={false} />
			</Canvas>
			{!isLoaded && (
				<View style={StyleSheet.absoluteFill} pointerEvents="none">
					<Loader loaderText="Загрузка карты..." />
				</View>
			)}
		</View>
	);
}

export default memo(InteractiveServerMap);

export const styles = StyleSheet.create({
	content: {
		width: 350,
		height: 350,
	},
});
