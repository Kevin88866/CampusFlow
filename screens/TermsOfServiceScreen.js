import React from 'react';
import { View, Text, ScrollView } from 'react-native';
export function TermsOfServiceScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Terms of Service</Text>
      <ScrollView>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
Welcome to CampusFlow! These Terms of Service govern your use of our mobile application. By registering or using CampusFlow, you agree to the following:
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
1. **Use License**: You may use CampusFlow only for personal, non-commercial purposes. You agree not to republish, redistribute, or sell any content.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
2. **User Conduct**: You agree not to harass, abuse, or harm other users, and to comply with all applicable laws.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
3. **Content Ownership**: You retain ownership of content you post, but you grant CampusFlow a worldwide license to display and distribute it.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
4. **Termination**: CampusFlow may suspend or terminate your account for any violation of these terms.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
5. **Disclaimer**: The app is provided "as is" without warranty of any kind. CampusFlow is not liable for any damages arising from your use.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
6. **Changes**: We may update these Terms at any time. Continued use constitutes acceptance of any changes.
        </Text>
      </ScrollView>
    </View>
  );
}