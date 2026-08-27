import { OrbitControls, Text3D } from "@react-three/drei/native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import { useIsFocused } from "expo-router";
import { RefObject, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";
import nunitoFontJson from "../../assets/fonts/Nunito_Regular.json";
import { Model } from "./Model";

function Animate({ ref }: { ref: RefObject<THREE.Object3D | null> }) {
	useFrame((state, delta) => {
		{
			if (ref.current) {
				ref.current.rotation.y += delta * 0.1;
			}
		}
	});

	return null;
}

export default function InteractiveServerMap() {
	const aircraftRef = useRef<THREE.Object3D>(null);
	const earthRef = useRef<THREE.Group>(null);

	const germany = earthRef.current?.getObjectByName("Germany");
	const netherlands = earthRef.current?.getObjectByName("Netherlands");
	const serbia = earthRef.current?.getObjectByName("Serbia");

	const isActive = useIsFocused();

	useEffect(() => {
		if (!isActive) {
			aircraftRef.current?.clear();
			earthRef.current?.clear();
			aircraftRef.current = null;
			earthRef.current = null;
		}
	}, [isActive]);

	return (
		<View style={styles.content}>
			<Canvas camera={{ position: [0, 14, 0], fov: 65 }}>
				<ambientLight intensity={0.7} />
				<directionalLight color="white" position={[0, 14, 0]} intensity={3} />
				<Animate ref={earthRef} />
				<Model
					ref={aircraftRef}
					model={"aircraft"}
					props={{
						scale: 0.1,
						position: [0, 8, 0],
						rotation: [Math.PI / 8, 0, 0],
					}}
				/>
				<group ref={earthRef}>
					<Model
						model={"earth"}
						props={{
							position: [0, 0, 0],
						}}
					/>
					<mesh position={germany?.position} scale={0.1}>
						<sphereGeometry />
						<meshBasicMaterial color={"#ff0000"} />
					</mesh>
					<mesh position={germany?.position.addScalar(1)}>
						<Text3D font={nunitoFontJson}>Germany</Text3D>
					</mesh>
					<mesh position={netherlands?.position} scale={0.1}>
						<sphereGeometry />
						<meshBasicMaterial color={"#ff0000"} />
					</mesh>
					<mesh position={netherlands?.position.addScalar(1)}>
						<Text3D font={nunitoFontJson}>Netherlands</Text3D>
					</mesh>
					<mesh position={serbia?.position} scale={0.1}>
						<sphereGeometry />
						<meshBasicMaterial color={"#ff0000"} />
					</mesh>
					<mesh position={serbia?.position.addScalar(1)}>
						<Text3D font={nunitoFontJson} scale={0.2}>
							Serbia
						</Text3D>
					</mesh>
				</group>
				<OrbitControls enableRotate={true} enableZoom={true} />
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	content: {
		width: 350,
		height: 350,
	},
});
