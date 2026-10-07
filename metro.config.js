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

	config.server = {
		...config.server,
		enhanceMiddleware: (middleware) => {
			return (req, res, next) => {
				if (
					req.url.startsWith("/inspector") &&
					(!req.headers.origin || req.headers.origin === "undefined")
				) {
					req.headers.origin = "http://localhost:8081";
				}
				return middleware(req, res, next);
			};
		},
	};

	return config;
})();
