import { useGLTF } from "@react-three/drei/native";
import { ThreeElement } from "@react-three/fiber";
import { useAssets } from "expo-asset";
import { forwardRef } from "react";
import * as THREE from "three";

export const Models = {
	earth: require("../../assets/models/earth/earth.glb"),
	aircraft: require("../../assets/models/aircraft/aircraft.glb"),
};

type ModelKey = keyof typeof Models;

type ModelProps = {
	model: ModelKey;
	props: ThreeElement<any>;
};

export const Model = forwardRef<THREE.Group | THREE.Object3D, ModelProps>(
	({ model, props }, ref) => {
		const [asset, error] = useAssets(Models[model]);

		if (error) {
			console.warn(error);
			return null;
		}
		if (!asset) return null;

		const localUrl = asset[0].localUri ?? "";

		const gltf = useGLTF(localUrl);

		return <primitive ref={ref} object={gltf.scene} {...props} />;
	},
);
