import {
	AndroidConfig,
	ConfigPlugin,
	withAndroidManifest,
	withDangerousMod,
} from "@expo/config-plugins";

interface FileSystemModule {
	promises: {
		mkdir(path: string, options: { recursive: boolean }): Promise<unknown>;
		writeFile(path: string, data: string): Promise<unknown>;
	};
}

interface PathModule {
	join(...paths: string[]): string;
}

declare function require(id: "fs"): FileSystemModule;
declare function require(id: "path"): PathModule;

const fs = require("fs");
const path = require("path");

const backupRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <include domain="database" path="RKStorage" />
  <exclude domain="sharedpref" path="SecureStore" />
</full-backup-content>
`;

const dataExtractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
    <include domain="database" path="RKStorage" />
    <exclude domain="sharedpref" path="SecureStore" />
  </cloud-backup>
  <device-transfer>
    <include domain="database" path="RKStorage" />
    <exclude domain="sharedpref" path="SecureStore" />
  </device-transfer>
</data-extraction-rules>
`;

const withAndroidUserIdBackup: ConfigPlugin = (config) => {
	config = withAndroidManifest(config, (modConfig) => {
		const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
			modConfig.modResults,
		);
		application.$["android:fullBackupContent"] =
			"@xml/traveler_vpn_backup_rules";
		application.$["android:dataExtractionRules"] =
			"@xml/traveler_vpn_data_extraction_rules";
		return modConfig;
	});

	return withDangerousMod(config, [
		"android",
		async (modConfig) => {
			const xmlDirectory = path.join(
				modConfig.modRequest.platformProjectRoot,
				"app",
				"src",
				"main",
				"res",
				"xml",
			);
			await fs.promises.mkdir(xmlDirectory, { recursive: true });
			await Promise.all([
				fs.promises.writeFile(
					path.join(xmlDirectory, "traveler_vpn_backup_rules.xml"),
					backupRules,
				),
				fs.promises.writeFile(
					path.join(xmlDirectory, "traveler_vpn_data_extraction_rules.xml"),
					dataExtractionRules,
				),
			]);
			return modConfig;
		},
	]);
};

export default withAndroidUserIdBackup;
