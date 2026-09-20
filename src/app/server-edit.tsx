import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useBackendClient } from "@/hooks/useBackendClient";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import { showToast } from "@/utility/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import CountryPicker, {
	Country,
	CountryCode,
} from "react-native-country-picker-modal";
import { ServerEntity } from "../../db/schema/servers";

export default function EditServerScreen() {
	const { serverId } = useLocalSearchParams<{ serverId: string }>();
	const router = useRouter();
	const { getServerById, updateServer } = useServers();
	const { getGeoFromIp } = useBackendClient();
	const { convertShareLinksToJson } = useLibxray();
	const theme = useAppTheme();
	const styles = createStyles(theme);
	const headerHeight = useHeaderHeight();
	const [server, setServer] = useState<ServerEntity | null>(null);
	const [remark, setRemark] = useState("");
	const [countryTag, setCountryTag] = useState<CountryCode>("US");
	const [countryName, setCountryName] = useState("");
	const [connectionLink, setConnectionLink] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		getServerById(Number(serverId))
			.then((selected) => {
				if (!selected || selected.type !== "user_defined") {
					showToast("User-defined server not found");
					router.back();
					return;
				}
				setServer(selected);
				setRemark(selected.remark);
				setCountryTag(selected.countryTag as CountryCode);
				setCountryName(selected.country);
				setConnectionLink(selected.connectionLink);
			})
			.catch((error) => {
				console.error(error);
				showToast("Unable to load server");
				router.back();
			});
	}, [serverId]);

	const selectCountry = (country: Country) => {
		setCountryTag(country.cca2);
		setCountryName(
			typeof country.name === "string" ? country.name : country.name.common,
		);
	};

	const saveServer = async () => {
		if (!server) return;
		if (!remark.trim() || !connectionLink.trim()) {
			showToast("Server name and connection link are required");
			return;
		}

		setIsSaving(true);
		try {
			const nextConnectionLink = connectionLink.trim();
			let endpoint = {};
			if (nextConnectionLink !== server.connectionLink) {
				const linkJson = await convertShareLinksToJson(nextConnectionLink);
				const address = JSON.parse(linkJson).data.outbounds[0].settings.address;
				const geo = await getGeoFromIp(address);
				if (!geo?.response) throw new Error("Unable to resolve server location");
				endpoint = {
					address,
					city: geo.response.city,
					latitude: geo.response.latitude,
					longitude: geo.response.longitude,
				};
			}
			await updateServer({
				...server,
				...endpoint,
				remark: remark.trim(),
				countryTag,
				country: countryName,
				connectionLink: nextConnectionLink,
			});
			showToast("Server updated");
			router.back();
		} catch (error) {
			console.error(error);
			showToast("Unable to update server");
		} finally {
			setIsSaving(false);
		}
	};

	if (!server) {
		return (
			<View style={[styles.loading, { paddingTop: headerHeight }]}>
				<ActivityIndicator size="large" color={theme.colors.important2} />
			</View>
		);
	}

	return (
		<View style={[styles.container, { paddingTop: headerHeight + 16 }]}>
			<Text style={styles.title}>Edit server</Text>
			<View>
				<Text style={styles.label}>Country</Text>
				<CountryPicker
					countryCode={countryTag}
					withFilter
					withFlag
					onSelect={selectCountry}
					theme={{
						backgroundColor: theme.colors.primary,
						filterPlaceholderTextColor: theme.colors.text,
						onBackgroundTextColor: theme.colors.text,
					}}
					renderFlagButton={(props) => (
						<TouchableOpacity
							style={styles.input}
							onPress={props.onOpen}>
							<Text style={styles.inputText}>{countryName || countryTag}</Text>
						</TouchableOpacity>
					)}
				/>
			</View>
			<View>
				<Text style={styles.label}>Server name</Text>
				<TextInput style={styles.input} value={remark} onChangeText={setRemark} />
			</View>
			<View>
				<Text style={styles.label}>Connection link</Text>
				<TextInput
					style={styles.input}
					value={connectionLink}
					onChangeText={setConnectionLink}
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>
			<TouchableOpacity
				disabled={isSaving}
				style={[styles.saveButton, isSaving && styles.disabled]}
				onPress={saveServer}>
				<Text style={styles.saveButtonText}>
					{isSaving ? "Saving..." : "Save changes"}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 20,
		},
		loading: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
		},
		title: {
			color: theme.colors.secondary,
			fontFamily: "CustomFont-Regular",
			fontSize: 26,
			fontWeight: "600",
			textAlign: "center",
		},
		label: {
			color: theme.colors.text,
			fontSize: 16,
			marginBottom: 8,
		},
		input: {
			minHeight: 48,
			borderWidth: 1,
			borderColor: "#777",
			borderRadius: 12,
			paddingHorizontal: 12,
			backgroundColor: theme.colors.card,
			color: theme.colors.text,
			justifyContent: "center",
		},
		inputText: {
			color: theme.colors.text,
			fontSize: 16,
		},
		saveButton: {
			alignItems: "center",
			alignSelf: "center",
			backgroundColor: theme.colors.important2,
			borderRadius: 12,
			paddingHorizontal: 24,
			paddingVertical: 12,
			width: "65%",
		},
		disabled: {
			opacity: 0.6,
		},
		saveButtonText: {
			color: theme.colors.background,
			fontFamily: "CustomFont-Regular",
			fontSize: 18,
		},
	});
