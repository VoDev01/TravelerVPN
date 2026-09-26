import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

export interface MapFrame {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ServerMapContextData {
	/**
	 * Window-space rect (from measureInWindow) where the interactive map canvas
	 * should render, or null when the map is not on screen. The persistent canvas
	 * keeps its last frame/size when null (only hidden), so its GL surface is
	 * never resized to zero or destroyed.
	 */
	frame: MapFrame | null;
	setFrame: (frame: MapFrame | null) => void;
	isConnecting: boolean;
	setIsConnecting: (isConnecting: boolean) => void;
	connectingServerId: number | undefined;
	setConnectingServerId: (id: number | undefined) => void;
	selectedLocation: string | null;
	setSelectedLocation: (location: string | null) => void;
	/**
	 * True while the globe's flight animation is playing. The index uses this to
	 * delay *revealing* CONNECTED (and the duration timer) until the plane lands,
	 * even though the tunnel itself connects in parallel the moment it is started.
	 */
	flightInProgress: boolean;
	setFlightInProgress: (inProgress: boolean) => void;
}

const ServerMapContext = createContext<ServerMapContextData | undefined>(
	undefined,
);

export const ServerMapProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [frame, setFrameState] = useState<MapFrame | null>(null);
	const [isConnecting, setIsConnectingState] = useState(false);
	const [connectingServerId, setConnectingServerIdState] = useState<
		number | undefined
	>(undefined);
	const [selectedLocation, setSelectedLocationState] = useState<string | null>(
		null,
	);
	const [flightInProgress, setFlightInProgressState] = useState(false);

	const setFrame = useCallback((next: MapFrame | null) => {
		setFrameState(next);
	}, []);

	const setIsConnecting = useCallback((next: boolean) => {
		setIsConnectingState(next);
	}, []);

	const setConnectingServerId = useCallback((next: number | undefined) => {
		setConnectingServerIdState(next);
	}, []);

	const setSelectedLocation = useCallback((next: string | null) => {
		setSelectedLocationState(next);
	}, []);

	const setFlightInProgress = useCallback((next: boolean) => {
		setFlightInProgressState(next);
	}, []);

	const value = useMemo(
		() => ({
			frame,
			setFrame,
			isConnecting,
			setIsConnecting,
			connectingServerId,
			setConnectingServerId,
			selectedLocation,
			setSelectedLocation,
			flightInProgress,
			setFlightInProgress,
		}),
		[
			frame,
			setFrame,
			isConnecting,
			setIsConnecting,
			connectingServerId,
			setConnectingServerId,
			selectedLocation,
			setSelectedLocation,
			flightInProgress,
			setFlightInProgress,
		],
	);

	return (
		<ServerMapContext.Provider value={value}>
			{children}
		</ServerMapContext.Provider>
	);
};

export const useServerMap = () => {
	const context = useContext(ServerMapContext);
	if (!context) {
		throw new Error("useServerMap must be used within a ServerMapProvider");
	}
	return context;
};
