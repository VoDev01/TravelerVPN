import { MapFrame, useServerMap } from "@/context/ServerMapContext";
import { GeoLocation, useBackendClient } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import { OrbitControls, useProgress } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import * as THREE from "three";
import FlightTrajectory from "./FlightTrajectory";
import GlobeMarker, { geodeticToECEF } from "./GlobeMarker";
import { Loader } from "./Loader";
import { Model } from "./Model";

export function Animate({
	ref,
	shouldAnimate,
}: {
	ref: RefObject<THREE.Object3D | null>;
	shouldAnimate: boolean;
}) {
	useFrame((state, delta) => {
		if (ref.current && shouldAnimate) {
			ref.current.rotation.y -= delta * 0.1;
		}
	});

	return null;
}

interface ServerGeoLocation {
	id: number;
	location: GeoLocation;
}

/**
 * Globally persistent interactive React Three Fiber globe.
 *
 * The canvas is mounted once above the root <Stack> and is never unmounted, so
 * the GL context survives navigation to every screen (tab switches and root
 * route changes alike). Its visibility is driven purely by whether the index
 * placeholder reports a frame (deterministic, never event-stuck). Because it is
 * a global overlay above the Stack, a short timer-based fade-in delays its
 * reveal just past the typical screen transition so it eases in instead of
 * popping over an in-flight animation. While hidden it keeps its last frame and
 * only fades out / disables hit testing, so the GL surface is never resized.
 */
export default function InteractiveServerMap() {
	const { t } = useTranslation();

	const {
		frame,
		connectingServerId,
		setSelectedLocation,
		setFlightInProgress,
	} = useServerMap();

	const isVisible = frame !== null;

	const lastFrameRef = useRef<MapFrame | null>(null);
	if (frame) {
		lastFrameRef.current = frame;
	}

	// Deterministic reveal: fade in slightly delayed so the globe eases in after
	// a screen transition instead of popping mid-animation, and hide instantly
	// when it should not show. Timer-driven, so it can never get stuck hidden.
	const reveal = useSharedValue(0);
	useEffect(() => {
		reveal.value = isVisible
			? withDelay(
					220,
					withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
				)
			: withTiming(0, { duration: 0 });
	}, [isVisible, reveal]);
	const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));

	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const { progress } = useProgress();
	const isLoaded = progress === 100;

	const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
	const [isCameraMoving, setIsCameraMoving] = useState(false);
	const initialCameraPos = useRef<THREE.Vector3 | null>(null);

	const [serversLocations, setServersLocations] = useState<ServerGeoLocation[]>(
		[],
	);
	const [serversById, setServersById] = useState<Map<number, GeoLocation>>(
		new Map(),
	);

	const [userGeo, setUserGeo] = useState<GeoLocation | null>(null);

	// Each connection creates a brand-new flight (fresh vectors + a unique key) so
	// FlightTrajectory's memoized curve/points recompute and it reliably re-triggers
	// instead of reusing a stale path.
	const [flight, setFlight] = useState<{
		id: number;
		seq: number;
		A: THREE.Vector3;
		B: THREE.Vector3;
	} | null>(null);
	const lastFlightIdRef = useRef<number | undefined>(undefined);
	const flightSeqRef = useRef(0);

	// Publish whether the flight animation is currently running so the index can
	// delay *revealing* CONNECTED until the plane lands (the tunnel connects now,
	// the status is shown at animation end).
	useEffect(() => {
		setFlightInProgress(flight !== null);
	}, [flight, setFlightInProgress]);

	useEffect(
		() => () => {
			setFlightInProgress(false);
		},
		[setFlightInProgress],
	);

	const { getUserGeoFromIp } = useBackendClient();
	const { fetchServers } = useServers();

	// Rebuild the marker sets from the current server list. `fetchServers` is a new
	// closure every render (not memoized by its hook), so capture it in a stable
	// callback; its behavior does not depend on component state.
	const refreshServers = useCallback(() => {
		fetchServers()
			.then((servers) => {
				const byCity = new Map<string, ServerGeoLocation>();
				const byId = new Map<number, GeoLocation>();
				servers.forEach((server) => {
					const location: GeoLocation = {
						country: server.country,
						city: server.city,
						latitude: server.latitude,
						longitude: server.longitude,
					};
					byId.set(server.id, location);
					byCity.set(server.city, { id: server.id, location });
				});
				// Always assign (even when empty) so removed servers clear their markers.
				setServersLocations([...byCity.values()]);
				setServersById(byId);
			})
			.catch((e) => {
				console.error(`Unable to load servers for InteractiveMap: ${e}`);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		getUserGeoFromIp()
			.then((response) => {
				setUserGeo(response?.response);
			})
			.catch((e) => {
				console.error(e);
			});
		refreshServers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshServers]);

	// Re-sync markers when the globe becomes visible (e.g. returning to the index
	// tab after adding/removing servers elsewhere). R3F re-renders the marker
	// children from the updated state without remounting the Canvas.
	useEffect(() => {
		if (isVisible) {
			refreshServers();
		}
	}, [isVisible, refreshServers]);

	useEffect(() => {
		if (connectingServerId == null) {
			lastFlightIdRef.current = undefined;
			// Abort any in-flight animation immediately (e.g. disconnect pressed
			// mid-flight) instead of letting the plane keep flying to nowhere.
			setFlight(null);
			return;
		}
		if (connectingServerId === lastFlightIdRef.current) return;
		if (!userGeo) return;

		const endpoint = serversById.get(connectingServerId);
		if (!endpoint) return;

		lastFlightIdRef.current = connectingServerId;
		const A = new THREE.Vector3(
			...geodeticToECEF(userGeo.latitude, userGeo.longitude, 7.22),
		);
		const B = new THREE.Vector3(
			...geodeticToECEF(endpoint.latitude, endpoint.longitude, 7.22),
		);
		flightSeqRef.current += 1;
		setFlight({ id: connectingServerId, seq: flightSeqRef.current, A, B });
	}, [connectingServerId, userGeo, serversById]);

	// The arc is sampled from 64 points, so segments beyond ~64 add no real
	// resolution yet make each mesh-line rebuild (and reveal step) more expensive.
	const flightSegments = flight
		? Math.min(Math.max(Math.floor(flight.A.distanceTo(flight.B) * 8), 24), 64)
		: 40;

	const handleFlightVisibility = (visible: boolean) => {
		if (!visible) {
			setFlight(null);
		}
	};

	// If a flight is aborted (e.g. disconnect mid-animation) the trajectory never
	// reports completion, so re-enable orbit controls instead of leaving the camera
	// locked in "moving" state.
	useEffect(() => {
		if (flight === null) {
			setIsCameraMoving(false);
		}
	}, [flight]);

	// Per-marker press radius, sized from the nearest-neighbour gap so hit targets
	// grow without ever overlapping each other (radius <= half the nearest gap).
	const markerHitRadii = useMemo(() => {
		const globeRadius = 7.22;
		const points = serversLocations.map((serverGeo) => ({
			id: serverGeo.id,
			position: new THREE.Vector3(
				...geodeticToECEF(
					serverGeo.location.latitude,
					serverGeo.location.longitude,
					globeRadius,
				),
			),
		}));

		const radii: Record<number, number> = {};
		for (let i = 0; i < points.length; i++) {
			let nearest = Infinity;
			for (let j = 0; j < points.length; j++) {
				if (i === j) continue;
				const distance = points[i].position.distanceTo(points[j].position);
				if (distance < nearest) nearest = distance;
			}
			const halfNearest = nearest === Infinity ? 1 : nearest / 2;
			radii[points[i].id] = Math.min(
				halfNearest,
				1,
				Math.max(0.2, halfNearest * 0.9),
			);
		}
		return radii;
	}, [serversLocations]);

	const connectingMarkerId = useMemo(() => {
		if (connectingServerId == null) return undefined;
		const city = serversById.get(connectingServerId)?.city;
		if (!city) return undefined;
		return serversLocations.find(
			(serverGeo) => serverGeo.location.city === city,
		)?.id;
	}, [connectingServerId, serversById, serversLocations]);

	const renderServerLocation = (serverGeo: ServerGeoLocation) => {
		if (serverGeo.location) {
			return (
				<GlobeMarker
					key={serverGeo.id}
					cityId={serverGeo.location.city}
					lat={serverGeo.location.latitude}
					lon={serverGeo.location.longitude}
					activeCityId={activeLocationId}
					hitRadius={markerHitRadii[serverGeo.id]}
					onSelect={(city: string | null) => {
						setActiveLocationId(city);
						setSelectedLocation(city);
					}}
					id={serverGeo.id}
					serverConnectingId={connectingMarkerId}
				/>
			);
		}
	};

	const renderUserLocation = () => {
		if (userGeo && flight) {
			return (
				<GlobeMarker
					key={"user_geo"}
					cityId={"user_geo"}
					lat={userGeo.latitude}
					lon={userGeo.longitude}
					activeCityId={activeLocationId}
					onSelect={(city: string | null) => {
						setActiveLocationId(city);
						setSelectedLocation(city);
					}}
					id={0}
					serverConnectingId={undefined}
				/>
			);
		}
	};

	// Keep the last measured frame while hidden so the GL surface size is stable.
	const geometry = frame ?? lastFrameRef.current;

	const canvasStyle = geometry
		? {
				left: geometry.x,
				top: geometry.y,
				width: geometry.width,
				height: geometry.height,
			}
		: { width: 1, height: 1 };

	return (
		<View style={styles.host} pointerEvents="box-none">
			<Animated.View
				style={[styles.canvas, canvasStyle, revealStyle]}
				pointerEvents={isVisible ? "auto" : "none"}>
				<Canvas
					gl={{
						antialias: true,
						powerPreference: "high-performance",
						failIfMajorPerformanceCaveat: false,
					}}
					camera={{ position: [-14, 0, 0], fov: 65 }}>
					<ambientLight intensity={3} />
					<Animate ref={earthRef} shouldAnimate={!flight} />
					<group ref={earthRef}>
						<Model
							model={"earth"}
							props={{
								position: [0, 0, 0],
							}}
						/>
						{serversLocations.map((serverGeo) =>
							renderServerLocation(serverGeo),
						)}
						{renderUserLocation()}
						<Model
							ref={aircraftRef}
							model={"aircraft"}
							props={{
								scale: 0.04,
							}}
						/>
						{flight && (
							<FlightTrajectory
								key={`${flight.id}-${flight.seq}`}
								A={flight.A}
								B={flight.B}
								height={2.5}
								aircraftRef={aircraftRef}
								segments={flightSegments}
								onAnimationStateChange={setIsCameraMoving}
								animationVisible={handleFlightVisibility}
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
				{isVisible && !isLoaded && (
					<View style={StyleSheet.absoluteFill} pointerEvents="none">
						<Loader loaderText={t("loader_map")} />
					</View>
				)}
			</Animated.View>
		</View>
	);
}

export const styles = StyleSheet.create({
	host: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 50,
	},
	canvas: {
		position: "absolute",
		overflow: "hidden",
	},
});
