import EarthIcon from "@/assets/images/boxicons_globe.svg";
import GermanyIcon from "@/assets/images/emojione_flag-for-germany.svg";
import DownArrowIcon from "@/assets/images/line-md_arrow-down.svg";
import UpArrowIcon from "@/assets/images/line-md_arrow-up.svg";
import GasPumpIcon from "@/assets/images/osmic_fuel-14.svg";
import PlaneIcon from "@/assets/images/Plane.svg";
import LocationDialogue from "@/components/LocationDialogue";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MainScreen() {
  const [serverSelectionDialogueVisible, setServerSelectionDialogueVisible] = useState(false);

  return (
    <>
      <View style={styles.contentContainer}>
        <View style={styles.connectionStatus}>
          <View style={styles.speedContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0.00 Mbps</Text>
              <DownArrowIcon width={24} height={24} />
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>0.00 Mbps</Text>
              <UpArrowIcon width={24} height={24} />
            </View>
          </View>

          <Text style={styles.connectionDurationText}>00:15:11</Text>
          <View style={styles.locationData}>
            <Text style={styles.locationText}>Frankfurt</Text>
            <GermanyIcon width={32} height={32} />
          </View>
        </View>

        <View style={styles.mapContainer}>
          <PlaneIcon width={108} height={48} />
          <EarthIcon width={240} height={240} />
        </View>

        <TouchableOpacity
          style={styles.chooseServerButton}
          onPress={() => {
            setServerSelectionDialogueVisible(true)
          }}
        >
          <Text style={styles.chooseServerButtonText}>Choose server</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.trafficContainer}>
        <View style={styles.trafficStatusData}>
          <GasPumpIcon width={48} height={48} fill={"#c40"} />
          <Text style={styles.dataLabel}>4.5/5.0 GB</Text>
        </View>
        <View style={styles.trafficStatusBar}>
          <View style={styles.dataBarFill} />
        </View>
      </View>

      <LocationDialogue
            dialogueVisible={serverSelectionDialogueVisible}
            onClose={() => {setServerSelectionDialogueVisible(!serverSelectionDialogueVisible)}}
          />
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  speedContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 32,
  },
  statItem: {
    alignItems: "center",
    columnGap: 8,
    flexDirection: "row",
  },
  statValue: {
    color: "#ffffffff",
    fontSize: 18,
  },
  statLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  connectionStatus: {
    alignItems: "center",
    rowGap: 24,
    marginBottom: 24,
  },
  connectionDurationText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 4,
  },
  locationText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 4,
  },
  mapContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  locationData: {
    flexDirection: "row",
    columnGap: 24,
  },
  mapImage: {
    width: 150,
    height: 150,
  },
  chooseServerButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#00ff00",
  },
  chooseServerButtonText: {
    color: "#00ff00",
    fontSize: 20,
  },
  trafficContainer: {
    marginTop: "auto",
  },
  trafficStatusData: {
    marginBottom: 10,
    columnGap: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  dataIconImage: {
    width: 24,
    height: 24,
  },
  dataLabel: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 8,
  },
  trafficStatusBar: {
    height: 12,
    backgroundColor: "#00ff00",
    alignItems: "flex-end",
    borderRadius: 12,
    overflow: "hidden",
  },
  dataBarFill: {
    height: "100%",
    backgroundColor: "#a6a6a6",
    width: "10%",
  },
});
