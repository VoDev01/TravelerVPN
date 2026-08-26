import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useAssets } from "expo-asset";
import { Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";

function GlobeModel() {
	const [assets, error] = useAssets([
		require("../../assets/models/earth.gltf"),
	]);

	if (!assets) {
		return (
			<View>
				<ActivityIndicator size="large" color="#0000ff" />
				<Text>Загрузка 3D-модели...</Text>
			</View>
		);
	} else if (error) {
		return (
			<View>
				<Text>Ошибка загрузки ассета: {error.message}</Text>
			</View>
		);
	}

	const localUri = assets[0].localUri || assets[0].uri;
	const scene = useGLTF(localUri);
	return <primitive object={scene} scale={0.2}></primitive>;
}

export default function InteractiveServerMap() {
	return (
		<View>
			<Canvas camera={{ fov: 90 }}>
				<ambientLight intensity={0.5} />
				<Suspense>
					<GlobeModel />
				</Suspense>
				<OrbitControls enableRotate={true} />
			</Canvas>
		</View>
	);
}
