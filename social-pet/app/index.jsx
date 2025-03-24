import { Text, View } from "react-native";
import { useFonts } from "expo-font";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link href="/login">
        <Text>Go To Login Screen</Text>
      </Link>
    </View>
  );
}
