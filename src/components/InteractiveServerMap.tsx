import { OrbitControls } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { RefObject, Suspense, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import * as THREE from "three";
import { Model } from "./Model";

function Animate({ ref }: { ref: RefObject<THREE.Group | null> }) {
	useFrame((state, delta) => {
		{
			if (ref.current) {
				ref.current.rotation.y += delta * 0.1;
				if (ref.current.rotation.y >= 360) ref.current.rotation.y = 0;
			}
		}
	});

	return null;
}

function Loader() {
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#fff" />
		</View>
	);
}

export default function InteractiveServerMap() {
	const aircraftRef = useRef<THREE.Group>(null);
	const earthRef = useRef<THREE.Group>(null);

	return (
		<View style={styles.content}>
			<Suspense fallback={<Loader />}>
				<Canvas camera={{ position: [1.4, 0, 0], fov: 65 }}>
					<ambientLight intensity={1} />
					<directionalLight
						color="white"
						position={[10, 15, -10]}
						intensity={3}
					/>
					<Animate ref={earthRef} />
					<Model
						ref={aircraftRef}
						model={"aircraft"}
						props={{
							scale: 0.007,
							position: [-0.2, 3.8, 0],
							rotation: [Math.PI / 8, 0, 0],
						}}
					/>
					<Model
						ref={earthRef}
						model={"earth"}
						props={{
							scale: 0.01,
							position: [-1, 0, 0],
						}}>
						<group rotation={[Math.PI / 2, 0, 0]} />
					</Model>
					<OrbitControls enableRotate={true} enableZoom={true} />
				</Canvas>
			</Suspense>
		</View>
	);
}

const styles = StyleSheet.create({
	content: {
		width: 350,
		height: 350,
	},
});
