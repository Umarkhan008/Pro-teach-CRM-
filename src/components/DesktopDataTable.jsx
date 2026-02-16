import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

/**
 * DesktopDataTable - A proper desktop data table component
 * Renders data in a spreadsheet-like format for desktop views
 */
const DesktopDataTable = ({
    columns = [],
    data = [],
    onRowPress,
    onSort,
    sortColumn,
    sortDirection = 'asc',
    emptyMessage = "Ma'lumot topilmadi",
    rowActions,
    selectable = false,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
}) => {
    const { theme, isDarkMode } = useContext(ThemeContext);

    const renderHeaderCell = (column, index) => {
        const isSortable = column.sortable !== false;
        const isSorted = sortColumn === column.key;

        return (
            <TouchableOpacity
                key={column.key || index}
                style={[
                    styles.headerCell,
                    { width: column.width || 'auto', flex: column.flex || 1 },
                    column.align === 'right' && styles.alignRight,
                    column.align === 'center' && styles.alignCenter,
                ]}
                onPress={() => isSortable && onSort && onSort(column.key)}
                disabled={!isSortable}
                activeOpacity={isSortable ? 0.7 : 1}
            >
                <Text style={[styles.headerText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {column.title}
                </Text>
                {isSortable && isSorted && (
                    <Ionicons
                        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={theme.primary}
                        style={{ marginLeft: 4 }}
                    />
                )}
            </TouchableOpacity>
        );
    };

    const renderDataCell = (item, column, rowIndex) => {
        const value = column.render
            ? column.render(item[column.key], item, rowIndex)
            : item[column.key];

        return (
            <View
                key={column.key}
                style={[
                    styles.dataCell,
                    { width: column.width || 'auto', flex: column.flex || 1 },
                    column.align === 'right' && styles.alignRight,
                    column.align === 'center' && styles.alignCenter,
                ]}
            >
                {typeof value === 'string' || typeof value === 'number' ? (
                    <Text style={[styles.cellText, { color: theme.text }]} numberOfLines={1}>
                        {value}
                    </Text>
                ) : (
                    value
                )}
            </View>
        );
    };

    const renderRow = (item, index) => {
        const isSelected = selectedRows.includes(item.id);
        const isEven = index % 2 === 0;

        return (
            <TouchableOpacity
                key={item.id || index}
                style={[
                    styles.dataRow,
                    {
                        backgroundColor: isSelected
                            ? `${theme.primary}15`
                            : isEven
                                ? (isDarkMode ? '#1a1a2e' : '#FAFAFA')
                                : (isDarkMode ? '#16161a' : '#FFFFFF'),
                    },
                ]}
                onPress={() => onRowPress && onRowPress(item)}
                activeOpacity={onRowPress ? 0.7 : 1}
            >
                {selectable && (
                    <TouchableOpacity
                        style={styles.checkboxCell}
                        onPress={() => onSelectRow && onSelectRow(item.id)}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}>
                            {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                )}
                {columns.map((column) => renderDataCell(item, column, index))}
                {rowActions && (
                    <View style={styles.actionsCell}>
                        {rowActions(item, index)}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header Row */}
            <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
                {selectable && (
                    <TouchableOpacity
                        style={styles.checkboxCell}
                        onPress={onSelectAll}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            selectedRows.length === data.length && data.length > 0 && {
                                backgroundColor: theme.primary,
                                borderColor: theme.primary
                            }
                        ]}>
                            {selectedRows.length === data.length && data.length > 0 && (
                                <Ionicons name="checkmark" size={12} color="#fff" />
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                {columns.map((column, index) => renderHeaderCell(column, index))}
                {rowActions && <View style={styles.actionsHeader}><Text style={styles.headerText}>Amallar</Text></View>}
            </View>

            {/* Data Rows */}
            {data.length > 0 ? (
                data.map((item, index) => renderRow(item, index))
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="file-tray-outline" size={48} color={theme.textLight} />
                    <Text style={[styles.emptyText, { color: theme.textLight }]}>{emptyMessage}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
    },
    headerCell: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            userSelect: 'none',
        }),
    },
    headerText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
        }),
    },
    dataCell: {
        paddingHorizontal: 8,
    },
    cellText: {
        fontSize: 14,
    },
    alignRight: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    alignCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxCell: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionsCell: {
        width: 120,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionsHeader: {
        width: 120,
        alignItems: 'flex-end',
        paddingHorizontal: 8,
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
});

export default DesktopDataTable;
