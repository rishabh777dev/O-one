import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { ActionCardData } from '../../types';

interface ActionCardProps {
  data: ActionCardData;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  data,
  onPrimaryPress,
  onSecondaryPress,
}) => {
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardHeaderTitle}>{data.title}</Text>

      {/* Embedded Preview Box */}
      <View style={styles.previewBox}>
        {data.fields.map((field, idx) => (
          <View
            key={idx}
            style={[
              styles.fieldRow,
              idx === data.fields.length - 1 && !data.body && styles.noBorder,
            ]}
          >
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {field.value}
            </Text>
          </View>
        ))}

        {data.body ? (
          <View style={styles.bodyContainer}>
            <Text style={styles.bodyText}>{data.body}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.whitePillBtn}
          onPress={onPrimaryPress}
          activeOpacity={0.8}
        >
          <Text style={styles.whitePillText}>{data.primaryActionLabel}</Text>
        </TouchableOpacity>

        {data.secondaryActionLabel ? (
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={onSecondaryPress}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>{data.secondaryActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    marginTop: 4,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewBox: {
    backgroundColor: colors.bgCardInner,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderInner,
    gap: 12,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    width: 60,
    fontSize: 13,
    color: colors.textMuted,
  },
  fieldValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  bodyContainer: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  whitePillBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: colors.btnPrimaryBg,
    borderRadius: 9999,
  },
  whitePillText: {
    color: colors.btnPrimaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  ghostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 9999,
  },
  ghostBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
});
