import nunitoFont from "@/assets/fonts/Nunito_Regular.json";
import { Billboard, Center, Text3D, useFont } from "@react-three/drei/native";
import { useMemo } from "react";

export function geodeticToECEF(
	lat: number,
	lon: number,
	radius: number,
): Coordinates {
	const phi = (91 - lat) * (Math.PI / 180);
	const lambda = (66 - lon) * (Math.PI / 180);
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
	id: string;
	activeId: string | null;
	onSelect: (id: string) => void;
}

export default function GlobeMarker({
	lat,
	lon,
	id,
	onSelect,
	activeId,
}: GlobeMarkerProps) {
	const font = useFont(nunitoFont as any);

	const position = useMemo(() => geodeticToECEF(lat, lon, 7.22), [lat, lon]);
	const isActive = id === activeId;

	return (
		<group position={position}>
			<mesh
				onClick={(e) => {
					e.stopPropagation();
					onSelect(id);
				}}>
				<sphereGeometry args={[0.2, 16, 16]} />
				<meshBasicMaterial color={isActive ? "#00ff00" : "#ff0000"} />
			</mesh>

			{isActive && (
				<Billboard position={[0, 1.6, 0]}>
					<Center>
						<Text3D font={font.data} size={0.5} height={0} bevelEnabled={false}>
							{id}
							<meshStandardMaterial
								color="#fff"
								metalness={0}
								roughness={1}
								polygonOffset={true}
							/>
						</Text3D>
					</Center>
				</Billboard>
			)}
		</group>
	);
}
