import { Loader } from "@/components/Loader";
import { useAssets } from "expo-asset";
import { createContext, useContext } from "react";

interface ModelContextData {
	models: Record<string, string>;
}

const ModelContext = createContext<ModelContextData | undefined>(undefined);

export const ModelProvider = ({ children }: { children: React.ReactNode }) => {
	const [assets, error] = useAssets([
		require("../../assets/models/earth/earth.glb"),
		require("../../assets/models/aircraft/aircraft.glb"),
	]);

	if (error) {
		console.error(`Could not load models: ${error}`);
		return;
	}

	if (!assets) return <Loader loaderText="Loading 3d assets..." />;

	return (
		<ModelContext.Provider
			value={{ models: { earth: assets[0].uri, aircraft: assets[1].uri } }}>
			{children}
		</ModelContext.Provider>
	);
};

export const useModels = () => {
	const context = useContext(ModelContext);
	if (!context) {
		throw new Error("useModels must be used within a ModelProvider");
	}
	return context.models;
};
