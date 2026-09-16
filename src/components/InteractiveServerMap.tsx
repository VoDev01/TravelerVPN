import { GeoLocation, useBackendClient } from "@/hooks/useBackendClient";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import { appEmitter } from "@/utility/emitter";
import { OrbitControls, useProgress } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as Crypto from "expo-crypto";
import { useIsFocused } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
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

export default function InteractiveServerMap() {
	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const isActive = useIsFocused();
	const { progress, active } = useProgress();
	const isLoaded = progress === 100;
	const [isServersLoaded, setIsServersLoaded] = useState(false);

	const [activeLocationId, setActiveLocationId] = useState<number | null>(null);
	const [isCameraMoving, setIsCameraMoving] = useState(false);
	const [isFlightPathDefined, setIsFlightPathDefined] = useState(false);

	const [serversLocations, setServersLocations] = useState<ServerGeoLocation[]>(
		[],
	);

	const [userGeo, setUserGeo] = useState<GeoLocation | null>(null);

	const { getUserGeoFromIp } = useBackendClient();
	const { fetchServers } = useServers();
	const { convertShareLinksToJson } = useLibxray();

	useEffect(() => {
		if (aircraftRef.current) {
			aircraftRef.current.visible = isActive;
		}
		if (earthRef.current) {
			earthRef.current.visible = isActive;
		}
	}, [isActive]);

	useEffect(() => {
		SecureStore.getItemAsync("USER_ID")
			.then((userId) => {
				if (!userId) {
					let generated = Crypto.randomUUID();
					SecureStore.setItemAsync("USER_ID", generated);
					userId = generated;
				}
				getUserGeoFromIp(userId)
					.then((response) => {
						setUserGeo(response?.response);
					})
					.catch((e) => {
						console.error(e);
					});
				fetchServers(userId)
					.then((servers) => {
						if (servers.length > 0) {
							servers.forEach((server) => {
								if (server.type === "user_defined") {
									convertShareLinksToJson(server.connectionLink).then(
										(json) => {
											server.address = JSON.parse(json).address;
										},
									);
								}
								setServersLocations([
									...serversLocations.filter((item) => item.id !== server.id),
									{
										id: server.id,
										location: {
											country: server.country,
											city: server.city,
											latitude: server.latitude,
											longitude: server.longitude,
										},
									},
								]);
							});
							setIsServersLoaded(true);
						}
					})
					.catch((e) => {
						console.error(`Unable to load servers for InteractiveMap: ${e}`);
						setIsServersLoaded(false);
					});
			})
			.catch((e) => {
				console.error(e);
			});
	}, []);

	const A = new THREE.Vector3();
	const B = new THREE.Vector3();

	const optimalSegments = useMemo(() => {
		const distance = A.distanceTo(B);

		const calculated = Math.floor(distance * 40);

		return Math.min(Math.max(calculated, 40), 150);
	}, [A, B]);

	useEffect(() => {
		appEmitter.addListener("onServerConnecting", (id: number) => {
			if (serversLocations.length > 0) {
				const server = serversLocations.find((server) => {
					server.id === id;
				});
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
		});
	}, []);

	const renderServerLocation = (serverGeo: ServerGeoLocation) => {
		if (serverGeo.location) {
			return (
				<GlobeMarker
					key={serverGeo.id}
					id={serverGeo.id}
					lat={serverGeo.location.latitude}
					lon={serverGeo.location.longitude}
					activeId={activeLocationId}
					onSelect={(id: number) => {
						setActiveLocationId(id);
						appEmitter.emit("onChooseServerLocation", id);
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
			<Canvas camera={{ position: [-16, 0, 0], fov: 65 }}>
				<ambientLight intensity={3} />
				<Animate ref={earthRef} />
				<group ref={earthRef}>
					<Model
						model={"earth"}
						props={{
							position: [0, 0, 0],
						}}
					/>
					{serversLocations
						.filter(
							(server, index, self) =>
								self.findIndex(
									(s) => s.location?.city === server.location?.city,
								) === index,
						)
						.map((serverGeo) => renderServerLocation(serverGeo))}
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

export const styles = StyleSheet.create({
	content: {
		width: 350,
		height: 350,
	},
});
