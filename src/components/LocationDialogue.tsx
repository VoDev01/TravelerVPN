import { useAppTheme } from "@/ThemeContext";
import { CustomTheme } from "@/constants/theme";
import { useServers } from "@/hooks/useServers";
import { Suspense, use, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { ServerEntity } from "../../db/schema/servers";

type LocationDialogueProps = {
	dialogueVisible: boolean;
	onClose: () => void;
	onSelect: (serverId: number) => void;
};

function LocationDialogueContent({
	onSelect,
}: {
	onSelect: (id: number) => void;
}) {
	const [selectedServer, setSelectedServer] = useState<number>();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const { serversPromise, refreshServers } = useServers();
	const servers = use(serversPromise);

	const theme = useAppTheme();
	const styles = createStyle(theme);

	const onRefresh = async () => {
		setIsRefreshing(true);
		await refreshServers();
		setIsRefreshing(false);
	};

	const handlePress = (id: number) => {
		setSelectedServer(id);
		onSelect(id);
	};

	const renderServer = ({ item }: { item: ServerEntity }) => {
		const borderColor =
			item.id === selectedServer ? theme.colors.important2 : "#00000000";
		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.serverRow, { borderColor }]}
				onPress={() => handlePress(item.id)}>
				<View style={styles.serverInfo}>
					<Text style={styles.serverLocation}>{item.locationCountry}</Text>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<FlatList
			data={servers}
			keyExtractor={(item) => item.id.toString()}
			renderItem={renderServer}
			ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					tintColor={theme.colors.background}
				/>
			}
		/>
	);
}

const LocationDialogue = (props: LocationDialogueProps) => {
	const [selectedServer, setSelectedServer] = useState<number>();
	const { t } = useTranslation();

	const theme = useAppTheme();
	const styles = createStyle(theme);

	return (
		<Modal
			animationType="fade"
			transparent={true}
			backdropColor={"#272727"}
			visible={props.dialogueVisible}
			onRequestClose={props.onClose}>
			<TouchableWithoutFeedback onPress={props.onClose}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>{t("available_servers")}</Text>

						<View
							style={{
								flex: 1,
								justifyContent: "center",
							}}>
							<Suspense
								fallback={
									<View
										style={{
											padding: 20,
											alignItems: "center",
											justifyContent: "center",
										}}>
										<ActivityIndicator
											size="large"
											color={theme.colors.background}
										/>
										<Text style={{ color: theme.colors.text, marginTop: 10 }}>
											Загрузка серверов...
										</Text>
									</View>
								}>
								<LocationDialogueContent
									onSelect={(id) => setSelectedServer(id)}
								/>
							</Suspense>
						</View>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={[styles.button, styles.cancelButton]}
								onPress={props.onClose}>
								<Text style={styles.buttonText}>{t("cancel")}</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.submitButton]}
								onPress={() =>
									selectedServer !== undefined
										? props.onSelect(selectedServer)
										: props.onClose
								}>
								<Text style={styles.buttonText}>{t("select")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default LocationDialogue;

const createStyle = (theme: CustomTheme) =>
	StyleSheet.create({
		modalOverlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			justifyContent: "center",
			alignItems: "center",
		},
		modalContainer: {
			width: "86%",
			height: 512,
			backgroundColor: theme.colors.card,
			borderRadius: 16,
			padding: 24,
			justifyContent: "space-between",
		},
		modalTitle: {
			color: theme.colors.secondary,
			fontSize: 20,
			fontWeight: "600",
			textAlign: "center",
			marginBottom: 24,
		},
		serverList: {
			flex: 1,
			marginBottom: 24,
		},
		serverListScrollContent: {
			flexGrow: 1,
			rowGap: 24,
		},
		buttonContainer: {
			flexDirection: "row",
			justifyContent: "space-between",
			width: "100%",
		},
		button: {
			paddingHorizontal: 24,
			paddingVertical: 12,
			borderRadius: 12,
			justifyContent: "center",
			alignItems: "center",
		},
		cancelButton: {
			backgroundColor: theme.colors.important1,
		},
		submitButton: {
			backgroundColor: theme.colors.important2,
		},
		buttonText: {
			color: "#000",
			fontSize: 16,
			fontWeight: "600",
		},
		serverRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingVertical: 14,
			paddingHorizontal: 16,
			backgroundColor: theme.colors.tretiary,
			borderRadius: 12,
			borderWidth: 2,
		},
		serverInfo: {
			flex: 1,
		},
		serverLocation: {
			color: theme.colors.text,
			fontSize: 16,
			fontWeight: "600",
		},
	});
