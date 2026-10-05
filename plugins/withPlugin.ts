import { ConfigPlugin } from "expo/config-plugins";
import withAndroidAbiFilters from "./withAndroidAbiFilters";
import withAndroidPlugin from "./withAndroidPlugin";

const withPlugin: ConfigPlugin = (config) => {
	config = withAndroidPlugin(config);
	config = withAndroidAbiFilters(config);
	return config;
};

export default withPlugin;
