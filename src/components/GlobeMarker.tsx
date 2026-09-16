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
	id: number;
	activeId: number | null;
	onSelect: (id: number) => void;
}

export default function GlobeMarker({
	lat,
	lon,
	id,
	onSelect,
	activeId,
}: GlobeMarkerProps) {
	const position = geodeticToECEF(lat, lon, 7.22);
	const isActive = id === activeId;

	return (
		<mesh
			position={position}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(id);
			}}>
			<sphereGeometry args={[0.13, 16, 16]} />
			<meshBasicMaterial color={isActive ? "#00ff00" : "#ff0000"} />
		</mesh>
	);
}
