import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

type LocationDialogueProps = {
  dialogueVisible: boolean; 
  onClose: () => void;
}

const LocationDialogue = (props: LocationDialogueProps) => {
  return (
    <Modal
      animationType='fade'
      transparent={true}
      backdropColor={"#272727"}
      visible={props.dialogueVisible}
      onRequestClose={props.onClose}
    >
      <TouchableWithoutFeedback onPress={props.onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Доступные аэропорты</Text>

          <ScrollView style={styles.airportList} showsVerticalScrollIndicator={false}>
            {/* Здесь будут элементы списка */}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={props.onClose}>
              <Text style={styles.buttonText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.submitButton]}>
              <Text style={styles.buttonText}>Выбрать</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default LocationDialogue;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: "86%",
    height: 512,
    backgroundColor: '#272727ff',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  airportList: {
    flex: 1,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E53E3E',
  },
  submitButton: {
    backgroundColor: '#32D74B',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
