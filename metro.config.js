const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	const { transformer, resolver } = config;

	config.transformer = {
		...transformer,
		babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
	};

	config.resolver = {
		...resolver,
		assetExts: resolver.assetExts
			.filter((ext) => ext !== "svg" && ext !== "json")
			.concat(["glb", "gltf", "png", "jpg"]),
		sourceExts: resolver.sourceExts
			.filter((ext) => ext !== "glb" && ext !== "gltf")
			.concat(["svg", "sql", "cjs", "mjs", "json"]),
	};

	return config;
})();
