import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FileCode } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { CodeDiffData } from '../../types';

interface CodeDiffCardProps {
  diff: CodeDiffData;
  onAccept: () => void;
  onReject: () => void;
}

export const CodeDiffCard: React.FC<CodeDiffCardProps> = ({ diff, onAccept, onReject }) => {
  return (
    <View style={styles.cardContainer}>
      {/* File Path Header */}
      <View style={styles.fileHeader}>
        <View style={styles.fileNameRow}>
          <FileCode size={14} color="#FFFFFF" />
          <Text style={styles.filePathText}>{diff.filePath}</Text>
        </View>
        <Text style={styles.diffStats}>
          <Text style={styles.addStat}>+{diff.additions} </Text>
          <Text style={styles.delStat}>-{diff.deletions}</Text>
        </Text>
      </View>

      {/* Unified Diff Box */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.diffInnerBox}>
          {diff.lines.map((line, index) => {
            let rowStyle = styles.lineCtx;
            let textStyle = styles.lineTextCtx;

            if (line.type === 'del') {
              rowStyle = styles.lineDel;
              textStyle = styles.lineTextDel;
            } else if (line.type === 'add') {
              rowStyle = styles.lineAdd;
              textStyle = styles.lineTextAdd;
            }

            return (
              <View key={index} style={[styles.lineRow, rowStyle]}>
                <Text style={styles.lineNoText}>{line.lineNo || ' '}</Text>
                <Text style={[styles.lineCodeText, textStyle]}>{line.content}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* High-Contrast Action Buttons (Solid White Pill + Ghost) */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.whitePillBtn} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.whitePillText}>Accept & Apply</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={onReject} activeOpacity={0.7}>
          <Text style={styles.ghostBtnText}>Discard</Text>
        </TouchableOpacity>
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
    marginVertical: 6,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filePathText: {
    fontSize: 12.5,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  diffStats: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  addStat: {
    color: colors.accentEmerald,
  },
  delStat: {
    color: colors.accentRose,
  },
  diffInnerBox: {
    backgroundColor: colors.bgCardInner,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderInner,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 320,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginVertical: 1,
  },
  lineCtx: {
    backgroundColor: 'transparent',
  },
  lineDel: {
    backgroundColor: colors.diffDelBg,
  },
  lineAdd: {
    backgroundColor: colors.diffAddBg,
  },
  lineNoText: {
    width: 24,
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  lineCodeText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  lineTextCtx: {
    color: colors.textMuted,
  },
  lineTextDel: {
    color: colors.diffDelText,
  },
  lineTextAdd: {
    color: colors.diffAddText,
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
