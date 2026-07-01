import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LocationDialogueProps {
  onClose?: () => void;
}

export default function LocationDialogue({ onClose }: LocationDialogueProps) {
  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      <View style={styles.dialogue}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Доступные аэропорты</Text>

        <View style={styles.content}>
          {/* Content will be populated dynamically */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  dialogue: {
    width: '85%',
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 20,
    zIndex: 101,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#888',
    fontSize: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    minHeight: 200,
  },
});
