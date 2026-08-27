import { Center, useGLTF } from "@react-three/drei/native";
import { ThreeElement } from "@react-three/fiber";
import { useAssets } from "expo-asset";
import React, { forwardRef, ReactNode } from "react";
import * as THREE from "three";

export const Models = {
	earth: require("../../assets/models/earth/earth.glb"),
	aircraft: require("../../assets/models/aircraft/aircraft.glb"),
};

type ModelKey = keyof typeof Models;

type ModelProps = {
	model: ModelKey;
	children?: ReactNode;
	props: ThreeElement<any>;
};

export const Model = forwardRef<THREE.Group, ModelProps>(
	({ model, props, children }, ref) => {
		const [asset, error] = useAssets(Models[model]);
		if (!asset) {
			return null;
		} else if (asset && asset[0]) {
			const localUrl = asset[0].localUri ?? "";

			const gltf = useGLTF(localUrl);

			if (!children)
				return (
					<Center ref={ref}>
						<primitive object={gltf.scene} {...props} />
					</Center>
				);

			const childrenArray = React.Children.toArray(children);
			const targetIndex = Math.floor(childrenArray.length / 2);
			const newNodeWithKey = React.cloneElement(
				<primitive object={gltf.scene} {...props} />,
				{
					key: "primitive-three-object",
				},
			);
			const modifiedChildren = [
				...childrenArray.slice(0, targetIndex),
				newNodeWithKey,
				...childrenArray.slice(targetIndex),
			];

			return <Center ref={ref}>{modifiedChildren}</Center>;
		}
	},
);
