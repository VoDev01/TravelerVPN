import LeftArrowIcon from "@/assets/images/line-md_arrow-left.svg";
import SettingsIcon from "@/assets/images/mdi_gear.svg";
import { Link, usePathname } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const route = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {(() => {
        const isSettings = route === "/settings";

        return (
        <Link replace href={isSettings ? "/" : "/settings"}  style={styles.navigationIcon}>
          {!isSettings ? <SettingsIcon width={48} height={48} /> : <LeftArrowIcon width={48} height={48} />} 
        </Link>
        ); })
        ()}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  navigationIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  gearIcon: {
    width: 48,
    height: 48,
    tintColor: "#999",
  },
});
