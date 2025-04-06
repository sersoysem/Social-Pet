import { Text, View } from "react-native";
import { useFonts } from "expo-font";
import { Link, Redirect } from "expo-router";
import { useEffect } from "react";
import { useRootNavigationState } from "expo-router";
import { useUser } from "@clerk/clerk-expo";


export default function Index() {

  const {user}=useUser();
  

const rootNavigationState = useRootNavigationState();

useEffect(() => {
  CheckNavLoded();
}, []);


const CheckNavLoded = () => {
  if(!rootNavigationState.key)
    return null;
};

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {user ?
        <Redirect href={'/(tabs)/home'} />
           
        :<Redirect href={'/login'}/>
      }
    </View>
  );
}
