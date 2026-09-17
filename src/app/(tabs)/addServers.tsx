import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useBackendClient } from "@/hooks/useBackendClient";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
	Alert,
	Image,
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

export default function AddServers() {
	const [remark, setRemark] = useState("Default user server");
	const [countryTag, setCountryTag] = useState<CountryCode>("AM");
	const [country, setCountry] = useState<Country | null>(null);
	const [connectionLink, setConnectionLink] = useState("");

	const { addServer } = useServers();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const onSelect = (selectedCountry: Country) => {
		setCountryTag(selectedCountry.cca2);
		setCountry(selectedCountry);
	};

	const [serverSubmit, setServerSubmit] = useState(false);
	const { convertShareLinksToJson } = useLibxray();
	const { getGeoFromIp } = useBackendClient();

	const showAlert = (validationError: string) => {
		Alert.alert("Invalid server data", validationError, [
			{
				text: "OK",
			},
		]);
	};

	useEffect(() => {
		let address: string = "";
		convertShareLinksToJson(connectionLink)
			.then((json) => {
				address = JSON.parse(json).address;
			})
			.catch((e) => console.error(e));

		SecureStore.getItemAsync("USER_ID")
			.then((userId) => {
				if (!userId) throw new Error("User id is not defined");
				getGeoFromIp(userId, address)
					.then((geo) => {
						addServer({
							remark,
							countryTag,
							connectionLink,
							type: "user_defined",
							city: geo?.response.city,
							country: geo?.response.country,
							latitude: geo?.response.latitude,
							longitude: geo?.response.longitude,
						});
					})
					.catch((e) => console.error(e));
			})
			.catch((e) => console.error(e));

		return () => setServerSubmit(false);
	}, [serverSubmit]);

	return (
		<View style={styles.container}>
			<Text style={styles.headerFont}>Add your own servers</Text>
			<View>
				<Text style={styles.labelFont}>Choose country</Text>
				<CountryPicker
					theme={{
						backgroundColor: theme.colors.primary,
						filterPlaceholderTextColor: theme.colors.text,
						onBackgroundTextColor: theme.colors.text,
					}}
					countryCode={countryTag}
					withFilter
					withFlag
					withCountryNameButton
					onSelect={onSelect}
					renderFlagButton={(props) => {
						return (
							<TouchableOpacity
								{...props}
								onPress={props.onOpen}
								style={styles.input}>
								<View style={styles.flagButtonContainer}>
									{country?.flag && (
										<Image
											source={{ uri: country?.flag }}
											style={styles.flagImage}
											resizeMode="contain"
										/>
									)}
									<Text style={{ color: theme.colors.text, fontSize: 16 }}>
										{typeof country?.name === "string"
											? country.name
											: country?.name.common || "Choose country"}
									</Text>
								</View>
							</TouchableOpacity>
						);
					}}
				/>
			</View>
			<View>
				<Text style={styles.labelFont}>Name of your server</Text>
				<TextInput
					style={styles.input}
					onChangeText={(text) => setRemark(text)}
					value={remark}
				/>
			</View>
			<View>
				<Text style={styles.labelFont}>Paste connection link</Text>
				<TextInput
					style={styles.input}
					onChangeText={(text) => setConnectionLink(text)}
					value={connectionLink}
				/>
			</View>
			<TouchableOpacity
				style={styles.saveButton}
				onPress={() => {
					if (remark.length === 0) {
						showAlert("Remark cant be empty");
					} else if (connectionLink.length === 0) {
						showAlert("Connection link cant be empty");
					}
					setServerSubmit(true);
				}}>
				<Text style={styles.saveButtonText}>Save</Text>
			</TouchableOpacity>
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 12,
			paddingVertical: 24,
		},
		input: {
			flex: 1,
			minHeight: 48,
			borderWidth: 1,
			borderColor: "#ccc",
			borderRadius: 8,
			paddingHorizontal: 12,
			fontSize: 16,
			backgroundColor: theme.colors.card,
			color: theme.colors.text,
			justifyContent: "center",
		},
		labelFont: {
			fontSize: 16,
			color: theme.colors.text,
			marginBottom: 12,
		},
		headerFont: {
			fontSize: 24,
			color: theme.colors.text,
		},
		saveButton: {
			paddingHorizontal: 24,
			paddingVertical: 12,
			borderRadius: 12,
			width: "50%",
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: theme.colors.important2,
		},
		saveButtonText: {
			color: theme.colors.background,
			fontSize: 16,
			//fontFamily: "CustomFont-Regular",
		},
		flagButtonContainer: {
			flexDirection: "row",
		},
		flagImage: {
			width: 24,
			height: 24,
			marginRight: 12,
		},
	});
