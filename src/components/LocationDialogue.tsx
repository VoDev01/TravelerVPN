import { useServers } from "@/hooks/useServers";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
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

const LocationDialogue = (props: LocationDialogueProps) => {
	const { servers, addServer } = useServers();
	const [selectedServer, setSelectedServer] = useState<number>();
	const { t } = useTranslation();

	const renderServer = ({ item }: { item: ServerEntity }) => {
		const borderColor = item.id === selectedServer ? "#00E50F" : "#00000000";

		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.serverRow, { borderColor: borderColor }]}
				onPress={() => setSelectedServer(item.id)}>
				<View style={styles.serverInfo}>
					<Text style={styles.serverLocation}>{item.locationCountry}</Text>
				</View>
			</TouchableOpacity>
		);
	};

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

						<FlatList
							data={servers}
							style={styles.serverList}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.serverListScrollContent}
							renderItem={renderServer}
						/>
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

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		width: "86%",
		height: 512,
		backgroundColor: "#272727ff",
		borderRadius: 16,
		padding: 24,
		justifyContent: "space-between",
	},
	modalTitle: {
		color: "#FFFFFF",
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
		paddingVertical: 8,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	cancelButton: {
		backgroundColor: "#E53E3E",
	},
	submitButton: {
		backgroundColor: "#32D74B",
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
		backgroundColor: "#575757",
		borderRadius: 12,
		borderWidth: 2,
	},
	serverInfo: {
		flex: 1,
	},
	serverLocation: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});
