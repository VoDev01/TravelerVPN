import geistFont from "@/assets/fonts/Geist_Regular.json";
import { useAppTheme } from "@/context/ThemeContext";
import { Billboard, Center, Text3D, useFont } from "@react-three/drei/native";
import { useMemo } from "react";

// geodetic (lat/lon) -> ECEF on the earth sphere (north pole on +Y).
// POLAR_OFFSET_DEG = 90 so that y = R*sin(lat) and the equator sits exactly at
// y = 0 (the previous 91 shifted every marker ~1 degree south of its real
// latitude). PRIME_MERIDIAN_OFFSET_DEG aligns real longitude with the texture's
// Greenwich meridian on this model.
const POLAR_OFFSET_DEG = 90;
const PRIME_MERIDIAN_OFFSET_DEG = 66;

export function geodeticToECEF(
	lat: number,
	lon: number,
	radius: number,
): Coordinates {
	const phi = (POLAR_OFFSET_DEG - lat) * (Math.PI / 180);
	const lambda = (PRIME_MERIDIAN_OFFSET_DEG - lon) * (Math.PI / 180);
	return [
		radius * Math.sin(phi) * Math.cos(lambda),
		radius * Math.cos(phi),
		radius * Math.sin(phi) * Math.sin(lambda),
	];
}

export type Coordinates = [x: number, y: number, z: number];

export interface ServerLocation {
	id: string;
	lat: number;
	lon: number;
	name: string;
}

export interface ActiveLabel extends ServerLocation {
	x: number;
	y: number;
	isVisible: boolean;
}

interface GlobeMarkerProps {
	lat: number;
	lon: number;
	cityId: string;
	id: number;
	serverConnectingId: number | undefined;
	activeCityId: string | null;
	onSelect: (id: string | null) => void;
	hitRadius?: number;
}

const VISUAL_RADIUS = 0.2;

export default function GlobeMarker({
	lat,
	lon,
	cityId,
	onSelect,
	activeCityId,
	serverConnectingId,
	id,
	hitRadius = 0.35,
}: GlobeMarkerProps) {
	const font = useFont(geistFont as any);

	const position = useMemo(() => geodeticToECEF(lat, lon, 7.22), [lat, lon]);
	const isActive = cityId === activeCityId || serverConnectingId === id;

	const theme = useAppTheme();

	return (
		<group position={position}>
			<mesh
				onClick={(e) => {
					e.stopPropagation();
					if (!isActive) onSelect(cityId);
					else onSelect(null);
				}}>
				<sphereGeometry args={[Math.max(hitRadius, VISUAL_RADIUS), 16, 16]} />
				<meshBasicMaterial transparent opacity={0} depthWrite={false} />
			</mesh>

			<mesh>
				<sphereGeometry args={[VISUAL_RADIUS, 16, 16]} />
				<meshBasicMaterial color={isActive ? "#00ff00" : "#ff0000"} />
			</mesh>

			<group visible={isActive}>
				<Billboard position={[0, 1.2, 0]}>
					<Center>
						<Text3D font={font.data} size={0.3} height={0} bevelEnabled={false}>
							{cityId}
							<meshStandardMaterial
								color={theme.colors.map}
								metalness={0}
								roughness={1}
								polygonOffset={true}
							/>
						</Text3D>
					</Center>
				</Billboard>
			</group>
		</group>
	);
}
