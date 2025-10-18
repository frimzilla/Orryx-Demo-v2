import React from 'react';
import { SafeAreaView, View, Text, Pressable, StatusBar } from 'react-native';
export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, elevation: 4 }}>
          <Text style={{ color: '#9CC9FF', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Orryx</Text>
          <Text style={{ color: '#93A4B8', fontSize: 16, marginBottom: 20 }}>Internal APK builds via Expo EAS.</Text>
          <Pressable onPress={() => setCount(c => c + 1)} style={({ pressed }) => ({ backgroundColor: pressed ? '#6D28D9' : '#7C3AED', borderRadius: 12, paddingVertical: 12, alignItems: 'center' })}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Tap me: {count}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
