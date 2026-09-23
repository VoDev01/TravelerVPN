import { GeoLocation, useBackendClient } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import { OrbitControls, useProgress } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useIsFocused } from "expo-router";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function InteractiveServerMap({
	onSelectLocation,
	onServerConnectingId,
	isVpnConnecting,
}: {
	onSelectLocation: (location: string) => void;
	onServerConnectingId: number | undefined;
	isVpnConnecting: boolean;
}) {
	console.log(isVpnConnecting);
	const { t } = useTranslation();

	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const isActive = useIsFocused();
	const { progress } = useProgress();
	const isLoaded = progress === 100;

	const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
	const [isCameraMoving, setIsCameraMoving] = useState(false);
	const [isFlightPathDefined, setIsFlightPathDefined] = useState(false);
	const initialCameraPos = useRef<THREE.Vector3 | null>(null);

	const [serversLocations, setServersLocations] = useState<ServerGeoLocation[]>(
		[],
	);

	const [userGeo, setUserGeo] = useState<GeoLocation | null>(null);

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
		fetchServers()
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
				}
			})
			.catch((e) => {
				console.error(`Unable to load servers for InteractiveMap: ${e}`);
			});
	}, [isVpnConnecting]);

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

		if (isVpnConnecting) onServerConnecting(onServerConnectingId);
	}, [isVpnConnecting]);

	const renderServerLocation = (serverGeo: ServerGeoLocation) => {
		if (serverGeo.location) {
			return (
				<GlobeMarker
					key={serverGeo.id}
					cityId={serverGeo.location.city}
					lat={serverGeo.location.latitude}
					lon={serverGeo.location.longitude}
					activeCityId={activeLocationId}
					onSelect={(city: string) => {
						setActiveLocationId(city);
						onSelectLocation(city);
					}}
					id={serverGeo.id}
					serverConnectingId={onServerConnectingId}
				/>
			);
		}
	};

	const renderUserLocation = () => {
		if (userGeo && isFlightPathDefined) {
			return (
				<GlobeMarker
					key={"user_geo"}
					cityId={"user_geo"}
					lat={userGeo.latitude}
					lon={userGeo.longitude}
					activeCityId={activeLocationId}
					onSelect={(city: string) => {
						setActiveLocationId(city);
						onSelectLocation(city);
					}}
					id={0}
					serverConnectingId={undefined}
				/>
			);
		}
	};

	return (
		<View style={styles.content}>
			<Canvas
				gl={{
					antialias: false,
					powerPreference: "high-performance",
					failIfMajorPerformanceCaveat: true,
				}}
				camera={{ position: [-15.2, 0, 0], fov: 65 }}>
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
					{renderUserLocation()}
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
							animationVisible={setIsFlightPathDefined}
							initialCameraPosRef={initialCameraPos}
						/>
					)}
				</group>
				<OrbitControls
					enableRotate={!isCameraMoving}
					enableZoom={false}
					enablePan={false}
				/>
			</Canvas>
			{!isLoaded && (
				<View style={StyleSheet.absoluteFill} pointerEvents="none">
					<Loader loaderText={t("loader_map")} />
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
