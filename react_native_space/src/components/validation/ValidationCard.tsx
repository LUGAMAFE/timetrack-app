import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Menu, TextInput } from 'react-native-paper';
// @ts-ignore - Slider types issue
import Slider from '@react-native-community/slider';
import { useThemeStore } from '../../stores/themeStore';
import { CategoryBadge } from '../common/CategoryBadge';
import type { PendingBlock, OmissionReason, ValidationStatus } from '../../types';
import { format, parseISO } from 'date-fns';

interface ValidationCardProps {
  block: PendingBlock;
  omissionReasons: OmissionReason[];
  onValidate: (blockId: string, status: ValidationStatus, data?: {
    completion_percent?: number;
    omission_reason_id?: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

export function ValidationCard({
  block,
  omissionReasons,
  onValidate,
  isLoading = false,
}: ValidationCardProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const [showDetails, setShowDetails] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(50);
  const [selectedReason, setSelectedReason] = useState<OmissionReason | null>(null);
  const [notes, setNotes] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleComplete = () => {
    onValidate(block?.id ?? '', 'completed');
  };

  const handlePartial = () => {
    if (!showDetails) {
      setShowDetails(true);
      return;
    }
    onValidate(block?.id ?? '', 'partial', {
      completion_percent: completionPercent,
      notes: notes || undefined,
    });
  };

  const handleOmit = () => {
    if (!showDetails) {
      setShowDetails(true);
      return;
    }
    onValidate(block?.id ?? '', 'omitted', {
      omission_reason_id: selectedReason?.id,
      notes: notes || undefined,
    });
  };

  const daysAgoText = block?.days_ago === 1 
    ? 'Yesterday' 
    : block?.days_ago === 0 
      ? 'Today' 
      : `${block?.days_ago ?? 0} days ago`;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dateInfo}>
          <Text style={[styles.dateText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {block?.date ? format(parseISO(block.date), 'EEE, MMM d') : 'Unknown date'}
          </Text>
          <Text style={[styles.daysAgo, { color: '#FF9800' }]}>
            {daysAgoText}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
          {block?.start_time ?? '--:--'} - {block?.end_time ?? '--:--'}
        </Text>
      </View>

      {/* Block Info */}
      <View style={styles.blockInfo}>
        <CategoryBadge category={block?.category} size="medium" showLabel />
        <Text
          style={[styles.titleText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          numberOfLines={2}
        >
          {block?.title ?? 'Untitled'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          <Text style={[styles.actionText, { color: '#4CAF50' }]}>Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.partialButton]}
          onPress={handlePartial}
          disabled={isLoading}
        >
          <Ionicons name="ellipse-outline" size={28} color="#FF9800" />
          <Text style={[styles.actionText, { color: '#FF9800' }]}>Partial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.omitButton]}
          onPress={handleOmit}
          disabled={isLoading}
        >
          <Ionicons name="close-circle" size={28} color="#F44336" />
          <Text style={[styles.actionText, { color: '#F44336' }]}>Omitted</Text>
        </TouchableOpacity>
      </View>

      {/* Details Section */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.divider} />
          
          {/* Completion Slider */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Completion: {completionPercent}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={completionPercent}
              onValueChange={setCompletionPercent}
              minimumTrackTintColor="#6200EE"
              maximumTrackTintColor={isDarkMode ? '#555555' : '#DDDDDD'}
              thumbTintColor="#6200EE"
            />
          </View>

          {/* Omission Reason Picker */}
          <View style={styles.reasonContainer}>
            <Text style={[styles.reasonLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Reason for omission:
            </Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.reasonButton}
                  contentStyle={styles.reasonButtonContent}
                >
                  {selectedReason?.label ?? 'Select reason'}
                </Button>
              }
            >
              {(omissionReasons ?? []).map((reason) => (
                <Menu.Item
                  key={reason?.id}
                  onPress={() => {
                    setSelectedReason(reason);
                    setMenuVisible(false);
                  }}
                  title={reason?.label ?? ''}
                />
              ))}
            </Menu>
          </View>

          {/* Notes */}
          <TextInput
            mode="outlined"
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            style={styles.notesInput}
          />

          <View style={styles.confirmButtons}>
            <Button
              mode="text"
              onPress={() => setShowDetails(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (completionPercent === 0 || selectedReason) {
                  handleOmit();
                } else {
                  handlePartial();
                }
              }}
              loading={isLoading}
              style={styles.confirmButton}
            >
              Confirm
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysAgo: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
  },
  blockInfo: {
    marginTop: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF5020',
  },
  partialButton: {
    backgroundColor: '#FF980020',
  },
  omitButton: {
    backgroundColor: '#F4433620',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsContainer: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  reasonContainer: {
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  reasonButton: {
    borderColor: '#6200EE',
  },
  reasonButtonContent: {
    justifyContent: 'flex-start',
  },
  notesInput: {
    marginBottom: 16,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#6200EE',
  },
});
