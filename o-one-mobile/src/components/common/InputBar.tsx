import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Mic } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { useAgentStore } from '../../store/useAgentStore';

export const InputBar: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const { currentSurface, activeAgent } = useAppStore();
  const { sendMessage } = useAgentStore();

  let placeholder = `Message ${activeAgent.name}`;
  if (currentSurface === 'ide') {
    placeholder = 'Instruct Antigravity CLI...';
  } else if (currentSurface === 'workflows') {
    placeholder = 'Trigger or configure workflow...';
  } else if (currentSurface === 'marketplace') {
    placeholder = 'Search MCP tools & connectors...';
  }

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(activeAgent.id, inputText.trim());
    setInputText('');
  };

  return (
    <View style={styles.container}>
      {/* Plus Action Button */}
      <TouchableOpacity
        style={styles.plusBtn}
        onPress={() => alert('Add attachment, file, or trigger quick tool...')}
        activeOpacity={0.7}
      >
        <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Input Pill Field */}
      <View style={styles.inputPill}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        {/* Microphone Voice Button */}
        <TouchableOpacity
          style={styles.micBtn}
          onPress={() => alert('Listening for voice instruction...')}
          activeOpacity={0.6}
        >
          <Mic size={18} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgScreen,
    zIndex: 30,
  },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCircleBtn,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputPill: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 9999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    paddingVertical: 0,
  },
  micBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
