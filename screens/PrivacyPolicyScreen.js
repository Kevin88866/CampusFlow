import React from 'react';
import { View, Text, ScrollView } from 'react-native';
export function PrivacyPolicyScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Privacy Policy</Text>
      <ScrollView>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
          Last updated: June 28, 2025
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**1. Information Collection**
- We collect information you provide (username, phone number) and usage data.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**2. Use of Data**
- We use data to operate, maintain, and improve the app, and to communicate with you.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**3. Data Sharing**
- We do not share personal data with third parties except as required by law.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**4. Data Security**
- We implement reasonable measures to protect your data but cannot guarantee absolute security.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**5. Your Choices**
- You can update or delete your account data by contacting support or through app settings.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**6. Children's Privacy**
- CampusFlow is not intended for children under 13. We do not knowingly collect data from children.
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8 }}>
**7. Changes**
- We may update this Policy. We will notify you of material changes within the app.
        </Text>
      </ScrollView>
    </View>
  );
}