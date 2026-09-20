import { useModels } from "@/context/ModelContext";
import { useGLTF } from "@react-three/drei/native";
import { ThreeElement } from "@react-three/fiber";
import { forwardRef } from "react";
import * as THREE from "three";

type ModelProps = {
	model: "earth" | "aircraft";
	props: ThreeElement<any>;
};

export const Model = forwardRef<THREE.Group | THREE.Object3D, ModelProps>(
	({ model, props }, ref) => {
		const modelsAssets = useModels();

		const gltf = useGLTF(modelsAssets[model]);

		return <primitive ref={ref} object={gltf.scene} {...props} />;
	},
);
