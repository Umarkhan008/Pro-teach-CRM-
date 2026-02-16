import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';
import { ThemeContext } from '../../../context/ThemeContext';
import PremiumModal from '../../../components/PremiumModal';
import PremiumButton from '../../../components/PremiumButton';

const getGoogleScript = (settings = {}) => {
    // defaults
    const nameType = settings.sheetNameType || 'course'; // course, month, course_month
    const headerType = settings.headerType || 'days'; // days, dates
    const pColor = settings.presentColor || '#E8F5E9';
    const aColor = settings.absentColor || '#FFEBEE';

    return `/**
 * PRO TEACH - Professional Template Script (v2.3 - Dynamic)
 * Generated: ${new Date().toISOString().split('T')[0]}
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.type === 'ping') return ContentService.createTextOutput("Connected");
    if (data.type !== 'attendance') return ContentService.createTextOutput("Success");

    var courseName = data.courseName || "Guruh";
    var courseInfo = data.courseTime || "";
    var dateObj = new Date(data.date);
    
    
    // 1. Determine Sheet Name (Dynamic Strategy)
    var sheetName = "Sheet1";
    var monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
    var mName = monthNames[dateObj.getMonth()] + " (" + dateObj.getFullYear() + ")";
    
    // Strategy: ${nameType}
    if ("${nameType}" === "month") {
       sheetName = mName;
    } else if ("${nameType}" === "course_month") {
       sheetName = courseName + " - " + mName;
    } else {
       // Default: course
       sheetName = courseName;
    }
    
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Move to end to avoid confusion
      try { 
          var totalSheets = ss.getNumSheets();
          ss.setActiveSheet(sheet);
          ss.moveActiveSheet(totalSheets);
      } catch(e) {}
      
      if (sheet.getMaxColumns() < 36) sheet.insertColumnsAfter(sheet.getMaxColumns(), 36 - sheet.getMaxColumns());
    }
    
    // 2. Find Current Course Block
    var blockStart = findCourseBlock(sheet, courseName);
    if (blockStart === -1) {
      blockStart = createCourseBlock(sheet, courseName, courseInfo, "${headerType}");
    }
    
    // 3. Date Column
    var day = dateObj.getDate();
    var colIndex = day + 2; 
    if (colIndex > 33) colIndex = 33; 
    
    // 4. Process Students
    var students = data.students || [];
    var studentRowMap = getStudentRows(sheet, blockStart);
    
    students.forEach(function(s) {
      var name = String(s.name).trim();
      var rows = studentRowMap[name.toLowerCase()];
      
      // If NOT in current block, check if we need to Move them from another block
      if (!rows) {
        var movedRows = findAndMoveStudent(sheet, name, blockStart);
        if (movedRows) {
           rows = movedRows.rows;
           // If we deleted rows above, our blockStart might have shifted?
           // Actually findAndMoveStudent handles the insert relative to blockStart
           // But if blockStart itself relied on absolute rows and we deleted above it...
           // We re-fetch blockStart if needed, but for single student iteration usually locally consistent.
           // However, if we deleted a row above 'blockStart', 'blockStart' index in memory is wrong.
           if (movedRows.deletedRow < blockStart) {
             blockStart -= 2; 
           }
        } else {
           rows = addStudentToBlock(sheet, blockStart, name);
        }
      }
      
      // Update Keldi
      var statusVal = (s.status.toLowerCase() === 'present') ? 1 : 0;
      var cell1 = sheet.getRange(rows.keldi, colIndex);
      cell1.setValue(statusVal).setHorizontalAlignment("center");
      
      // Update Vazifa
      var homeworkVal = (s.homework === '' || s.homework === null) ? 0 : parseFloat(s.homework);
      if (isNaN(homeworkVal)) homeworkVal = 0;
      
      var cell2 = sheet.getRange(rows.vazifa, colIndex);
      cell2.setValue(homeworkVal).setHorizontalAlignment("center");
      
      // Add Note
      if (s.note) cell1.setNote(s.note);
    });

    return ContentService.createTextOutput("Success");

  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

function findAndMoveStudent(sheet, name, targetBlockStart) {
  // Search entire column A for the student
  var lastRow = sheet.getLastRow();
  // Limit search to reasonable amount
  if (lastRow < 1) return null;
  
  var names = sheet.getRange(1, 1, lastRow, 1).getValues();
  var normalizedName = name.toLowerCase();
  
  for (var i = 0; i < names.length; i++) {
    // Check match
    if (String(names[i][0]).toLowerCase().trim() === normalizedName) {
      var foundRow = i + 1;
      
      // Verify it is a student row (next row col 2 is "Vazifa")
      if (foundRow + 1 > lastRow) continue;
      var checkLabel = sheet.getRange(foundRow + 1, 2).getValue();
      if (checkLabel !== "Vazifa") continue;

      // Ensure we are NOT in the target block (already handled by main loop, but safety)
      // Actually main loop wouldn't call this if found in target block.
      
      // 1. Capture History
      var historyRange = sheet.getRange(foundRow, 3, 2, 31); // 31 Days (Cols 3-33)
      var oldValues = historyRange.getValues();
      var oldNotes = historyRange.getNotes();
      
      // 2. Delete Old
      sheet.deleteRows(foundRow, 2);
      
      // Adjust targetBlockStart if we deleted from above
      var effectiveBlockStart = targetBlockStart;
      if (foundRow < targetBlockStart) {
        effectiveBlockStart -= 2;
      }
      
      // 3. Create New in Target Block
      var newRows = addStudentToBlock(sheet, effectiveBlockStart, name);
      
      // 4. Paste History
      var targetRange = sheet.getRange(newRows.keldi, 3, 2, 31);
      targetRange.setValues(oldValues);
      targetRange.setNotes(oldNotes);
      
      return { rows: newRows, deletedRow: foundRow };
    }
  }
  return null;
}

function findCourseBlock(sheet, name) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return -1;
  var data = sheet.getRange(1, 1, lastRow, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === name) return i + 1;
  }
  return -1;
}

function createCourseBlock(sheet, name, info, headerType) {
  var startRow = sheet.getLastRow();
  if (startRow > 0) startRow += 2; else startRow = 1;
  var totalCols = 34;

  var headerRange = sheet.getRange(startRow, 1, 1, totalCols);
  headerRange.merge().setValue(name).setBackground("#B4C7E7").setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle").setBorder(true, true, true, true, true, true);
             
  var subHeader = sheet.getRange(startRow + 1, 1, 1, totalCols);
  
  // Header Strategy: days (1,2..) or dates (01.01)
  var headers = ["O'quvchi ismi", info];
  if (headerType === 'dates') {
     // We assume current month based on sheet? No, we need dateObj. 
     // For simplicity in static function, we'll stick to 1..31 for now or pass month later.
     // But user requested format options. Let's do 1..31 for SAFETY as dates vary.
     for (var d = 1; d <= 31; d++) headers.push(d); 
  } else {
     for (var d = 1; d <= 31; d++) headers.push(d);
  }
  
  headers.push("Darsdagi baxolar");
  
  subHeader.setValues([headers]).setBackground("#D9E1F2").setFontWeight("bold").setHorizontalAlignment("center").setBorder(true, true, true, true, true, true);
           
  try {
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 60);
    for(var c=3; c<=33; c++) sheet.setColumnWidth(c, 30);
    sheet.setColumnWidth(34, 110);
  } catch(e) {}

  return startRow;
}

function getStudentRows(sheet, blockStart) {
  var lastRow = sheet.getLastRow();
  var map = {};
  if (lastRow <= blockStart + 1) return map;
  
  var maxRows = lastRow - blockStart - 1;
  if (maxRows <= 0) return map;

  var range = sheet.getRange(blockStart + 2, 1, maxRows, 1);
  var names = range.getValues();
  
  for (var i = 0; i < names.length; i += 2) {
    var n = String(names[i][0]).trim().toLowerCase();
    if (!n) continue; 
    map[n] = { keldi: blockStart + 2 + i, vazifa: blockStart + 2 + i + 1 };
  }
  return map;
}

function addStudentToBlock(sheet, blockStart, name) {
  var searchRow = blockStart + 2;
  var lastRow = sheet.getLastRow();
  
  while (searchRow <= lastRow) {
    var val = sheet.getRange(searchRow, 1).getValue();
    if (val === "" || val === undefined) break; 
    searchRow += 2; 
  }
  
  var row = searchRow;
  var totalCols = 34;
  
  var studentIndex = (row - (blockStart + 2)) / 2;
  var isEven = studentIndex % 2 === 0;
  var color = isEven ? "#FFAE84" : "#A9D08E"; // Fallback colors if not passed
  
  // Use Dynamic Colors if possible
  var pColor = "${pColor}";
  var aColor = "${aColor}";
  // Actually we need Row Color (student bg). Let's keep alternate default for visibility.
  
  sheet.getRange(row, 1, 2, 1).merge().setValue(name).setBackground(color).setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("left");
  sheet.getRange(row, 2).setValue("Keldi").setBackground(pColor).setFontSize(8);
  sheet.getRange(row + 1, 2).setValue("Vazifa").setBackground(aColor).setFontSize(8);
  
  var r1 = row; var r2 = row + 1;
  var formula = "=SUM(C" + r1 + ":AG" + r1 + ") + SUM(C" + r2 + ":AG" + r2 + ")";
  
  sheet.getRange(row, totalCols, 2, 1).merge().setFormula(formula).setBackground(color).setFontWeight("bold").setVerticalAlignment("middle").setHorizontalAlignment("center");
  sheet.getRange(row, 1, 2, totalCols).setBorder(true, true, true, true, true, true);
  sheet.getRange(row, 3, 2, 31).setBackground(color); // Default background

  return { keldi: row, vazifa: row + 1 };
}

function doGet(e) {
  return ContentService.createTextOutput("Pro Teach V2.2 (Smart Move) Active");
}`;
};

const GoogleSheetsModal = ({ visible, onClose, settings, onSave }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);

    const [activeTab, setActiveTab] = useState('settings'); // settings, design, guide
    const [enabled, setEnabled] = useState(settings?.enableGoogleSheets || false);
    const [url, setUrl] = useState(settings?.googleSheetsUrl || '');
    const [viewUrl, setViewUrl] = useState(settings?.googleSheetsViewUrl || '');
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Design State
    const [sheetNameType, setSheetNameType] = useState(settings?.design?.sheetNameType || 'course');
    const [headerType, setHeaderType] = useState(settings?.design?.headerType || 'days');
    const [presentColor, setPresentColor] = useState(settings?.design?.presentColor || '#E8F5E9');
    const [absentColor, setAbsentColor] = useState(settings?.design?.absentColor || '#FFEBEE');

    useEffect(() => {
        if (visible) {
            setEnabled(settings?.enableGoogleSheets || false);
            setUrl(settings?.googleSheetsUrl || '');
            setViewUrl(settings?.googleSheetsViewUrl || '');
            setSheetNameType(settings?.design?.sheetNameType || 'course');
            setHeaderType(settings?.design?.headerType || 'days');
            setPresentColor(settings?.design?.presentColor || '#E8F5E9');
            setAbsentColor(settings?.design?.absentColor || '#FFEBEE');
            setTestResult(null);
        }
    }, [visible, settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({
                enableGoogleSheets: enabled,
                googleSheetsUrl: url,
                googleSheetsViewUrl: viewUrl,
                design: {
                    sheetNameType,
                    headerType,
                    presentColor,
                    absentColor,
                    lateColor: '#FFF8E1'
                }
            });
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert('Xatolik', 'Saqlashda muammo.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyScript = async () => {
        // Create a script instance with CURRENT state values
        const dynamicScript = getGoogleScript({
            sheetNameType,
            headerType,
            presentColor,
            absentColor
        });
        await Clipboard.setStringAsync(dynamicScript);
        Alert.alert('Nusxalandi', 'Kod nusxalandi. Google Apps Scriptga joylashtiring.');
    };

    const testConnection = async () => {
        if (!url) { Alert.alert('Xatolik', 'URL kiritilmagan'); return; }
        if (!url.includes('script.google.com')) {
            Alert.alert('Xatolik', 'URL noto\'g\'ri formatda. "script.google.com" bilan boshlanishi kerak.');
            return;
        }

        setTestResult('loading');
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ping' })
            });

            if (response.ok || response.status === 302 || response.status === 200) {
                setTestResult('success');
                Alert.alert("Muvaffaqiyatli", "Google Sheets bilan ulanish o'rnatildi!");
                setTimeout(() => setTestResult(null), 3000);
            } else {
                const text = await response.text();
                setTestResult('error');
                Alert.alert("Xatolik", `Server xatosi: ${response.status}\n${text.substring(0, 100)}`);
            }
        } catch (error) {
            setTestResult('error');
            Alert.alert("Ulanish Xatoligi", "Internet yoki URL da muammo bor:\n" + error.message);
        }
    };

    const TabBtn = ({ id, label, icon }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(id)}
            style={[styles.tabBtn, activeTab === id && { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
        >
            <Ionicons name={icon} size={18} color={activeTab === id ? theme.primary : theme.textSecondary} />
            <Text style={{ color: activeTab === id ? theme.primary : theme.textSecondary, fontWeight: '600' }}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title="Google Sheets"
            subtitle="Integratsiya va Dizayn"
            headerGradient={['#0F9D58', '#0B8043']}
            footer={<PremiumButton title="Saqlash" onPress={handleSave} isLoading={loading} style={{ flex: 1 }} gradient={['#0F9D58', '#0B8043']} />}
        >
            <View style={styles.tabContainer}>
                <TabBtn id="settings" label="Ulanish" icon="link" />
                <TabBtn id="design" label="Dizayn" icon="color-palette" />
                <TabBtn id="guide" label="Qo'llanma" icon="book" />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {activeTab === 'settings' && (
                    <View>
                        <View style={[styles.card, { backgroundColor: theme.surface }]}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="google-spreadsheet" size={28} color="#0F9D58" />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>Integratsiya</Text>
                                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{enabled ? 'Faol' : 'Nofaol'}</Text>
                                </View>
                                <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: '#0F9D5850' }} thumbColor={enabled ? '#0F9D58' : '#f4f3f4'} />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: theme.text }]}>Web App URL (Script URL)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                            value={url} onChangeText={setUrl} placeholder="https://script.google.com/..." placeholderTextColor={theme.textLight}
                        />

                        <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>Google Sheet Link (Ko'rish uchun)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                            value={viewUrl} onChangeText={setViewUrl} placeholder="https://docs.google.com/spreadsheets/d/..." placeholderTextColor={theme.textLight}
                        />

                        <TouchableOpacity
                            style={[styles.testRow, { backgroundColor: theme.surface }]}
                            onPress={testConnection}
                        >
                            <Text style={{ color: theme.text, fontWeight: '600' }}>Aloqani tekshirish (Test)</Text>
                            {testResult === 'loading' ? <ActivityIndicator color={theme.primary} /> : <Ionicons name={testResult === 'success' ? 'checkmark-circle' : 'flask-outline'} size={20} color={testResult === 'success' ? COLORS.success : theme.textSecondary} />}
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'design' && (
                    <View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Jadval Ko'rinishi</Text>

                        <Text style={[styles.label, { color: theme.textSecondary }]}>Varaq (Sheet) Nomlanishi</Text>
                        <View style={styles.optionRow}>
                            {['course', 'month', 'course_month'].map(opt => (
                                <TouchableOpacity key={opt} onPress={() => setSheetNameType(opt)} style={[styles.chip, sheetNameType === opt && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                                    <Text style={{ color: sheetNameType === opt ? '#fff' : theme.text }}>
                                        {opt === 'course' ? 'Kurs Nomi' : opt === 'month' ? 'Oy (Jan 2025)' : 'Kurs - Oy'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 15 }]}>Sana Ustunlari (Header)</Text>
                        <View style={styles.optionRow}>
                            {['days', 'dates'].map(opt => (
                                <TouchableOpacity key={opt} onPress={() => setHeaderType(opt)} style={[styles.chip, headerType === opt && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                                    <Text style={{ color: headerType === opt ? '#fff' : theme.text }}>
                                        {opt === 'days' ? '1, 2, 3...' : '01.01, 02.01...'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 25 }]}>Status Ranglari</Text>

                        <View style={[styles.colorRow, { backgroundColor: theme.surface }]}>
                            <Text style={{ color: theme.text }}>Kelgan (+)</Text>
                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                {['#E8F5E9', '#C8E6C9', '#A5D6A7'].map(c => (
                                    <TouchableOpacity key={c} onPress={() => setPresentColor(c)} style={[styles.colorDot, { backgroundColor: c }, presentColor === c && styles.selectedDot]} />
                                ))}
                            </View>
                        </View>

                        <View style={[styles.colorRow, { backgroundColor: theme.surface }]}>
                            <Text style={{ color: theme.text }}>Kelmagan (NB)</Text>
                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                {['#FFEBEE', '#FFCDD2', '#EF9A9A'].map(c => (
                                    <TouchableOpacity key={c} onPress={() => setAbsentColor(c)} style={[styles.colorDot, { backgroundColor: c }, absentColor === c && styles.selectedDot]} />
                                ))}
                            </View>
                        </View>

                    </View>
                )}

                {activeTab === 'guide' && (
                    <View>
                        <View style={[styles.guideBox, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.stepText, { color: theme.text }]}>1. Extensions &gt; Apps Script ga kiring.</Text>
                            <Text style={[styles.stepText, { color: theme.text }]}>2. Kodni o'chirib, yangisini qo'ying.</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyScript}><Text style={styles.copyBtnText}>Kodni nusxalash</Text></TouchableOpacity>
                            <Text style={[styles.stepText, { color: theme.text, marginTop: 15 }]}>3. Deploy &gt; New Deployment.</Text>
                            <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 5 }}>• Execute as: Me (O'zim)</Text>
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>• Who has access: Anyone (Hamma)</Text>
                            <Text style={[styles.stepText, { color: theme.text, marginTop: 15 }]}>4. URLni 'Ulanish' bo'limiga qo'ying.</Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 50 },
    card: { padding: 16, borderRadius: 16, marginBottom: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    cardDesc: { fontSize: 13 },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    stepNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, textAlign: 'center', lineHeight: 22, fontSize: 12, fontWeight: '600' },
    stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
    subStep: { fontSize: 13, marginLeft: 48, marginBottom: 4 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1, borderRadius: 10, marginTop: 8, alignSelf: 'flex-start' },
    copyBtnText: { fontSize: 13, fontWeight: '600' },
    label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, alignItems: 'center' },
    input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 44 },
    testBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    // New Styles for Tabs & Design
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
    tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 15, paddingHorizontal: 15, marginRight: 5, borderBottomWidth: 2, borderBottomColor: 'transparent' },

    testRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, marginTop: 10 },
    guideBox: { padding: 20, borderRadius: 16 },

    optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
    colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, marginBottom: 10 },
    colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
    selectedDot: { borderWidth: 2, borderColor: '#000', transform: [{ scale: 1.2 }] }
});

export default GoogleSheetsModal;

