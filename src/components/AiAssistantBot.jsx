import React, { useState, useRef, useContext, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    TextInput,
    ScrollView,
    Platform,
    Easing,
    useWindowDimensions,
    Modal,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { SchoolContext } from '../context/SchoolContext';

// === AI Knowledge Base ===
const AI_RESPONSES = {
    greetings: [
        "Salom! 👋 Men Pro Teach yordamchisiman! Sizga qanday yordam bera olaman?",
        "Assalomu alaykum! 🤖 Men sizning shaxsiy yordamchingizman. Savol bering!",
        "Hey! ✨ Men Pro Teach botiman. Menga istalgan savolni bering!"
    ],
    studentAdd: "📝 Yangi talaba qo'shish uchun:\n\n1. Chap menyudan \"O'quvchilar\" bo'limiga o'ting\n2. \"+\" (qo'shish) tugmasini bosing\n3. Talaba ma'lumotlarini kiriting\n4. Guruhni tanlang\n5. \"Saqlash\" tugmasini bosing\n\n✅ Tayyor! Talaba qo'shildi!",
    studentDelete: "🗑️ Talabani o'chirish uchun:\n\n1. \"O'quvchilar\" bo'limiga o'ting\n2. Kerakli talabani toping\n3. O'chirish tugmasini bosing\n4. Tasdiqlang\n\n⚠️ Diqqat: O'chirilgan talabani qayta tiklab bo'lmaydi!",
    groupRemove: "👤 Talabani guruhdan chiqarish uchun:\n\n1. Guruh sahifasiga o'ting\n2. Talaba yonidagi qizil tugmani bosing\n3. Tasdiqlang\n\n💡 Talaba tizimdan o'chirilmaydi, faqat guruhdan chiqariladi!",
    attendance: "✅ Davomat olish uchun:\n\n1. Guruh sahifasiga o'ting\n2. \"Davomat olish\" tugmasini bosing\n3. Har bir talabaning davomatini belgilang\n4. \"Saqlash\" tugmasini bosing\n\n📊 Davomat avtomatik saqlanadi!",
    payment: "💰 To'lov qo'shish uchun:\n\n1. Talaba profiliga o'ting\n2. \"To'lov\" tugmasini bosing\n3. Summani kiriting\n4. To'lov turini tanlang\n5. Tasdiqlang\n\n📈 Balans avtomatik yangilanadi!",
    groups: "📚 Guruh yaratish uchun:\n\n1. \"Guruhlar\" bo'limiga o'ting\n2. \"+\" tugmasini bosing\n3. Guruh nomi, o'qituvchi, vaqt va kunlarni kiriting\n4. Saqlang\n\n🎯 Guruhga talabalarni keyinchalik qo'shishingiz mumkin!",
    settings: "⚙️ Sozlamalar:\n\n• Chap menyuning pastki qismida \"Sozlamalar\" tugmasi bor\n• U yerda til, tema va Google Sheets sozlamalarini o'zgartirish mumkin\n\n🌙 Qorong'u rejim ham mavjud!",
    help: "🆘 Men quyidagi mavzularda yordam bera olaman:\n\n• 📝 Talaba qo'shish/o'chirish\n• 👥 Guruh yaratish\n• ✅ Davomat olish\n• 💰 To'lov qo'shish\n• ⚙️ Sozlamalar\n• 📊 Hisobotlar\n\nShunchaki savol yozing! 😊",
    unknown: [
        "🤔 Tushunmadim... Boshqacharoq so'rab ko'ring yoki \"yordam\" deb yozing!",
        "😅 Bu haqida bilmayman. \"yordam\" so'zini yozing va men nima qila olishimni ko'ring!",
        "🙈 Uzr, buni tushunmadim. Talaba, guruh, davomat yoki to'lov haqida so'rang!"
    ]
};

const findAnswer = (question) => {
    const q = question.toLowerCase().trim();
    if (['salom', 'hello', 'hi', 'hey', 'assalom', 'privet'].some(w => q.includes(w)))
        return AI_RESPONSES.greetings[Math.floor(Math.random() * AI_RESPONSES.greetings.length)];
    if (['qo\'shish', 'qoshish', 'yangi talaba', 'student add', 'talaba qo'].some(w => q.includes(w)))
        return AI_RESPONSES.studentAdd;
    if (['o\'chirish', 'ochirish', 'delete', 'olib tashlash'].some(w => q.includes(w)))
        return AI_RESPONSES.studentDelete;
    if (['guruhdan', 'chiqarish', 'remove', 'guruh dan'].some(w => q.includes(w)))
        return AI_RESPONSES.groupRemove;
    if (['davomat', 'attendance', 'keldi', 'kelmadi', 'qatnash'].some(w => q.includes(w)))
        return AI_RESPONSES.attendance;
    if (['tolov', 'to\'lov', 'payment', 'pul', 'summa', 'balans'].some(w => q.includes(w)))
        return AI_RESPONSES.payment;
    if (['guruh', 'group', 'kurs', 'course', 'sinf'].some(w => q.includes(w)))
        return AI_RESPONSES.groups;
    if (['sozlama', 'setting', 'tema', 'theme', 'til', 'language'].some(w => q.includes(w)))
        return AI_RESPONSES.settings;
    if (['yordam', 'help', 'nima', 'qanday', 'qila olasan', 'nimalar'].some(w => q.includes(w)))
        return AI_RESPONSES.help;
    return AI_RESPONSES.unknown[Math.floor(Math.random() * AI_RESPONSES.unknown.length)];
};

const QUICK_ACTIONS = [
    { label: "📝 Talaba qo'shish", key: "qo'shish" },
    { label: "👥 Guruh yaratish", key: "guruh" },
    { label: "✅ Davomat", key: "davomat" },
    { label: "💰 To'lov", key: "tolov" },
    { label: "🆘 Yordam", key: "yordam" },
];

// ========================================
// Animated Analysis Card Component
// ========================================
const AnalysisCard = ({ item, index, isDarkMode, theme }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 180,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 7,
                delay: index * 180,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [60, 0],
    });

    return (
        <Animated.View style={{
            opacity: slideAnim,
            transform: [{ translateY }, { scale: scaleAnim }],
        }}>
            <View style={[analysisStyles.card, {
                backgroundColor: isDarkMode ? '#1E1E2E' : '#FFFFFF',
                borderColor: isDarkMode ? item.color + '30' : item.color + '20',
            }]}>
                {/* Gradient top strip */}
                <View style={[analysisStyles.cardStrip, { backgroundColor: item.color }]} />

                <View style={analysisStyles.cardContent}>
                    <View style={analysisStyles.cardTop}>
                        <View style={[analysisStyles.cardIconBox, { backgroundColor: item.color + '18' }]}>
                            <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[analysisStyles.cardLabel, { color: isDarkMode ? '#A0A0B0' : '#777' }]}>
                                {item.label}
                            </Text>
                            <Text style={[analysisStyles.cardValue, { color: isDarkMode ? '#FFF' : '#1A1A2E' }]}>
                                {item.value}
                            </Text>
                        </View>
                        {item.trend && (
                            <View style={[analysisStyles.trendBadge, {
                                backgroundColor: item.trendUp ? '#10B98118' : '#EF444418'
                            }]}>
                                <Ionicons
                                    name={item.trendUp ? "trending-up" : "trending-down"}
                                    size={14}
                                    color={item.trendUp ? '#10B981' : '#EF4444'}
                                />
                                <Text style={{
                                    color: item.trendUp ? '#10B981' : '#EF4444',
                                    fontSize: 11,
                                    fontWeight: '700',
                                    marginLeft: 3,
                                }}>
                                    {item.trend}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Progress Bar */}
                    {item.progress !== undefined && (
                        <View style={analysisStyles.progressContainer}>
                            <View style={[analysisStyles.progressBg, { backgroundColor: isDarkMode ? '#2A2A3E' : '#F0F0F5' }]}>
                                <Animated.View style={[analysisStyles.progressFill, {
                                    backgroundColor: item.color,
                                    width: `${Math.min(item.progress, 100)}%`,
                                }]} />
                            </View>
                            <Text style={[analysisStyles.progressText, { color: isDarkMode ? '#888' : '#999' }]}>
                                {item.progressLabel}
                            </Text>
                        </View>
                    )}

                    {/* Detail */}
                    {item.detail && (
                        <Text style={[analysisStyles.cardDetail, { color: isDarkMode ? '#888' : '#999' }]}>
                            {item.detail}
                        </Text>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

// ========================================
// Recommendation Card (Different Animation)
// ========================================
const RecommendationCard = ({ item, index, totalCards, isDarkMode }) => {
    const slideXAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const iconSpin = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const lineWidth = useRef(new Animated.Value(0)).current;

    // Delay based on cards count + own index
    const baseDelay = (totalCards * 180) + 400;

    useEffect(() => {
        const delay = baseDelay + (index * 280);

        // Slide from left + fade in
        Animated.parallel([
            Animated.timing(slideXAnim, {
                toValue: 1,
                duration: 600,
                delay,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();

        // Spin icon
        Animated.timing(iconSpin, {
            toValue: 1,
            duration: 800,
            delay: delay + 200,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();

        // Shimmer bar fill
        Animated.timing(lineWidth, {
            toValue: 1,
            duration: 800,
            delay: delay + 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();

        // Shimmer effect loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2000,
                    delay: delay + 600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateX = slideXAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 0],
    });

    const iconRotation = iconSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
    });

    const priorityLabels = {
        yuqori: '🔴 Yuqori',
        muhim: '🟠 Muhim',
        "o'rta": '🔵 O\'rta',
        taklif: '💡 Taklif',
        yaxshi: '🟢 Yaxshi',
    };

    return (
        <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateX }],
        }}>
            <View style={[analysisStyles.recCard, {
                backgroundColor: isDarkMode ? '#1A1A2A' : '#FFFFFF',
                borderLeftColor: item.priorityColor,
                borderColor: isDarkMode ? item.borderColor : item.borderColor,
            }]}>
                {/* Top row: icon + title + priority */}
                <View style={analysisStyles.recCardTop}>
                    <Animated.View style={[analysisStyles.recIconCircle, {
                        backgroundColor: item.priorityColor + '15',
                        transform: [{ rotate: iconRotation }],
                    }]}>
                        <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                    </Animated.View>

                    <View style={{ flex: 1 }}>
                        <Text style={[analysisStyles.recTitle, { color: isDarkMode ? '#F0F0FF' : '#1A1A2E' }]}>
                            {item.title}
                        </Text>
                        <View style={[analysisStyles.recPriorityBadge, { backgroundColor: item.priorityColor + '15' }]}>
                            <Text style={{ color: item.priorityColor, fontSize: 10, fontWeight: '700' }}>
                                {priorityLabels[item.priority] || item.priority}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description text */}
                <Text style={[analysisStyles.recText, { color: isDarkMode ? '#AAAACC' : '#555' }]}>
                    {item.text}
                </Text>

                {/* Animated bottom line */}
                <View style={[analysisStyles.recBottomLine, { backgroundColor: isDarkMode ? '#2A2A40' : '#F0F0F5' }]}>
                    <Animated.View style={[analysisStyles.recBottomLineFill, {
                        backgroundColor: item.priorityColor,
                        opacity: shimmerOpacity,
                        width: lineWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    }]} />
                </View>
            </View>
        </Animated.View>
    );
};

// ========================================
// Main Component
// ========================================
const AiAssistantBot = () => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { students, courses, attendance, finance } = useContext(SchoolContext);
    const { width, height } = useWindowDimensions();
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef(null);

    // Animations
    const wobbleAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const chatSlide = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const eyeBlinkAnim = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const analysisOverlayAnim = useRef(new Animated.Value(0)).current;

    // === ANALYTICS DATA ===
    const analysisData = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        const todayName = dayNames[now.getDay()];
        const dateLabel = `${now.getDate()}-${monthNames[now.getMonth()]}, ${todayName}`;

        const totalStudents = students?.length || 0;
        const activeStudents = students?.filter(s => s.status === 'Active')?.length || 0;
        const waitingStudents = students?.filter(s => s.status === 'Waiting' || !s.assignedCourseId)?.length || 0;

        const totalCourses = courses?.length || 0;

        // Debtors
        const debtors = students?.filter(s => (s.balance || 0) < 0) || [];
        const totalDebt = debtors.reduce((sum, s) => sum + Math.abs(s.balance || 0), 0);

        // Positive balance
        const positiveStudents = students?.filter(s => (s.balance || 0) > 0) || [];
        const totalPositive = positiveStudents.reduce((sum, s) => sum + (s.balance || 0), 0);

        // Today's attendance
        const todayAttendance = attendance?.filter(a => a.date === todayStr) || [];
        const attendedToday = todayAttendance.reduce((count, a) => {
            if (a.records && Array.isArray(a.records)) {
                return count + a.records.filter(r => r.status === 'present' || r.status === 'keldi').length;
            }
            return count;
        }, 0);
        const totalTodayRecords = todayAttendance.reduce((count, a) => {
            if (a.records && Array.isArray(a.records)) return count + a.records.length;
            return count;
        }, 0);
        const attendanceRate = totalTodayRecords > 0 ? Math.round((attendedToday / totalTodayRecords) * 100) : 0;

        // Groups with today's attendance
        const groupsWithAttendance = todayAttendance.length;

        // Average balance
        const avgBalance = totalStudents > 0
            ? Math.round(students.reduce((sum, s) => sum + (s.balance || 0), 0) / totalStudents)
            : 0;

        // Fun facts
        const funFacts = [
            totalStudents > 10 ? `🎉 ${totalStudents} ta talaba bilan ajoyib jamoasiz!` : `💪 Har bir talaba muhim! Hozir ${totalStudents} ta talaba bor.`,
            debtors.length === 0 ? "🏆 Hech kim qarzdor emas! Zo'r!" : `⚠️ ${debtors.length} ta talaba qarzdor. Eslatma yuboring!`,
            attendanceRate >= 80 ? `🌟 Davomat ${attendanceRate}% — a'lo natija!` : attendanceRate > 0 ? `📊 Bugungi davomat ${attendanceRate}%. Qo'shimcha motivatsiya kerak!` : "📋 Bugun hali davomat olinmagan.",
        ];
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

        // === AI RECOMMENDATIONS ===
        const recommendations = [];

        // Qarzdorlar haqida taklif
        if (debtors.length > 0) {
            recommendations.push({
                icon: '💸',
                title: "To'lov eslatmasi yuboring",
                text: `${debtors.length} ta talaba qarzdor (jami ${totalDebt.toLocaleString()} UZS). Ularga to'lov eslatmasi yuboring!`,
                priority: 'yuqori',
                priorityColor: '#EF4444',
                bgGradient: ['#EF444410', '#EF444405'],
                borderColor: '#EF444430',
            });
        }

        // Davomat olinmagan
        if (totalTodayRecords === 0 && totalCourses > 0) {
            recommendations.push({
                icon: '📋',
                title: 'Bugun davomat oling',
                text: `${totalCourses} ta guruhingiz bor, lekin bugun hali davomat olinmagan. Davomatni olishni unutmang!`,
                priority: 'muhim',
                priorityColor: '#F2994A',
                bgGradient: ['#F2994A10', '#F2994A05'],
                borderColor: '#F2994A30',
            });
        } else if (totalTodayRecords > 0 && groupsWithAttendance < totalCourses) {
            const remainingGroups = totalCourses - groupsWithAttendance;
            recommendations.push({
                icon: '📝',
                title: `Yana ${remainingGroups} ta guruhda davomat oling`,
                text: `Bugun ${groupsWithAttendance}/${totalCourses} guruhda davomat olindik. Qolgan guruhlarni ham tekshiring!`,
                priority: "o'rta",
                priorityColor: '#0984E3',
                bgGradient: ['#0984E310', '#0984E305'],
                borderColor: '#0984E330',
            });
        }

        // Kutayotgan talabalar
        if (waitingStudents > 0) {
            recommendations.push({
                icon: '🎯',
                title: 'Kutayotgan talabalarni joylashtiring',
                text: `${waitingStudents} ta talaba hali guruhga biriktirilmagan. Ularni tegishli guruhlarga qo'shing!`,
                priority: "o'rta",
                priorityColor: '#6C5CE7',
                bgGradient: ['#6C5CE710', '#6C5CE705'],
                borderColor: '#6C5CE730',
            });
        }

        // Kam davomat
        if (attendanceRate > 0 && attendanceRate < 70) {
            recommendations.push({
                icon: '📢',
                title: 'Davomatni yaxshilang',
                text: `Bugungi davomat ${attendanceRate}% — bu pastroq ko'rsatkich. Talabalar bilan bog'laning va motivatsiya bering!`,
                priority: 'muhim',
                priorityColor: '#F2994A',
                bgGradient: ['#F2994A10', '#F2994A05'],
                borderColor: '#F2994A30',
            });
        }

        // Yaxshi natija
        if (attendanceRate >= 90) {
            recommendations.push({
                icon: '🏆',
                title: "A'lo natija!",
                text: `Bugungi davomat ${attendanceRate}% — ajoyib! Shu tarzda davom eting. Talabalarni rag'batlantiring!`,
                priority: 'yaxshi',
                priorityColor: '#10B981',
                bgGradient: ['#10B98110', '#10B98105'],
                borderColor: '#10B98130',
            });
        }

        // Agar hech qanday muammo bo'lmasa
        if (debtors.length === 0 && waitingStudents === 0) {
            recommendations.push({
                icon: '✨',
                title: 'Hammasi joyida!',
                text: "Barcha talabalar guruhlarga biriktirilgan va hech kim qarzdor emas. Ajoyib ish qilyapsiz!",
                priority: 'yaxshi',
                priorityColor: '#10B981',
                bgGradient: ['#10B98110', '#10B98105'],
                borderColor: '#10B98130',
            });
        }

        // Talabalar ko'paytirish
        if (totalStudents < 20) {
            recommendations.push({
                icon: '📈',
                title: "Ko'proq talaba jalb qiling",
                text: `Hozir ${totalStudents} ta talaba bor. Marketing va reklama orqali yangi talabalarni jalb qilishga harakat qiling!`,
                priority: 'taklif',
                priorityColor: '#0984E3',
                bgGradient: ['#0984E310', '#0984E305'],
                borderColor: '#0984E330',
            });
        }

        return {
            dateLabel,
            randomFact,
            recommendations,
            cards: [
                {
                    emoji: '👥',
                    label: 'Jami talabalar',
                    value: `${totalStudents} ta`,
                    color: '#6C5CE7',
                    detail: `${activeStudents} ta faol, ${waitingStudents} ta kutayotgan`,
                    progress: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0,
                    progressLabel: `${activeStudents}/${totalStudents} faol`,
                },
                {
                    emoji: '📚',
                    label: 'Guruhlar',
                    value: `${totalCourses} ta`,
                    color: '#00B894',
                    detail: `Bugun ${groupsWithAttendance} ta guruhda davomat olingan`,
                    progress: totalCourses > 0 ? (groupsWithAttendance / totalCourses) * 100 : 0,
                    progressLabel: `${groupsWithAttendance}/${totalCourses} davomat`,
                },
                {
                    emoji: '✅',
                    label: 'Bugungi davomat',
                    value: totalTodayRecords > 0 ? `${attendanceRate}%` : "Olinmagan",
                    color: '#0984E3',
                    trend: totalTodayRecords > 0 ? `${attendedToday}/${totalTodayRecords}` : null,
                    trendUp: attendanceRate >= 70,
                    detail: totalTodayRecords > 0 ? `${attendedToday} ta talaba kelgan` : 'Hali davomat olinmagan',
                    progress: attendanceRate,
                    progressLabel: `${attendanceRate}% qatnashish`,
                },
                {
                    emoji: '💰',
                    label: 'Ijobiy balans',
                    value: `${totalPositive.toLocaleString()} UZS`,
                    color: '#27AE60',
                    trend: `${positiveStudents.length} ta`,
                    trendUp: true,
                    detail: `${positiveStudents.length} ta talabada ijobiy balans`,
                },
                {
                    emoji: '🔴',
                    label: 'Qarzdorlik',
                    value: debtors.length > 0 ? `${totalDebt.toLocaleString()} UZS` : "Yo'q! 🎉",
                    color: '#EF4444',
                    trend: debtors.length > 0 ? `${debtors.length} ta` : null,
                    trendUp: false,
                    detail: debtors.length > 0 ? `${debtors.length} ta talaba qarzdor` : "Barcha talabalar to'lov qilgan!",
                    progress: totalStudents > 0 ? (debtors.length / totalStudents) * 100 : 0,
                    progressLabel: `${debtors.length}/${totalStudents} qarzdor`,
                },
                {
                    emoji: '📊',
                    label: "O'rtacha balans",
                    value: `${avgBalance.toLocaleString()} UZS`,
                    color: '#F2994A',
                    detail: avgBalance >= 0 ? "Umumiy balans ijobiy holatda" : "Umumiy balans salbiy holatda",
                    trend: avgBalance >= 0 ? 'Yaxshi' : 'Diqqat',
                    trendUp: avgBalance >= 0,
                },
            ]
        };
    }, [students, courses, attendance, finance]);

    // Floating animation
    useEffect(() => {
        const floating = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        floating.start();
        return () => floating.stop();
    }, []);

    // Wobble
    useEffect(() => {
        const wobble = Animated.loop(
            Animated.sequence([
                Animated.timing(wobbleAnim, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(wobbleAnim, { toValue: -1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(wobbleAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.delay(2000),
            ])
        );
        wobble.start();
        return () => wobble.stop();
    }, []);

    // Pulse
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Eye blink
    useEffect(() => {
        const blink = Animated.loop(
            Animated.sequence([
                Animated.delay(3000),
                Animated.timing(eyeBlinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
                Animated.timing(eyeBlinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            ])
        );
        blink.start();
        return () => blink.stop();
    }, []);

    const openAnalysis = useCallback(() => {
        setIsAnalysisOpen(true);
        Animated.spring(analysisOverlayAnim, {
            toValue: 1,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
        }).start();
    }, []);

    const closeAnalysis = useCallback(() => {
        Animated.timing(analysisOverlayAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setIsAnalysisOpen(false));
    }, []);

    const toggleChat = () => {
        if (!isOpen) {
            setIsOpen(true);
            if (messages.length === 0) {
                setMessages([{
                    id: 1, text: AI_RESPONSES.greetings[0], isBot: true,
                    time: new Date().toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })
                }]);
            }
            Animated.spring(chatSlide, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
        } else {
            Animated.timing(chatSlide, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setIsOpen(false));
        }
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
        ]).start();
    };

    const sendMessage = (text) => {
        const trimmed = (text || inputText).trim();
        if (!trimmed) return;
        const userMsg = { id: Date.now(), text: trimmed, isBot: false, time: new Date().toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setTimeout(() => {
            const answer = findAnswer(trimmed);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: answer, isBot: true, time: new Date().toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' }) }]);
        }, 600);
    };

    const wobbleRotation = wobbleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-8deg', '0deg', '8deg'] });
    const chatTranslateY = chatSlide.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
    const chatOpacity = chatSlide.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });

    const isDesktop = Platform.OS === 'web' && width >= 1280;
    const chatWidth = isDesktop ? 380 : Math.min(width - 30, 360);
    const chatHeight = isDesktop ? 520 : 460;

    const botColors = {
        primary: '#6C5CE7', secondary: '#A29BFE', accent: '#FD79A8', glow: '#6C5CE740',
        surface: isDarkMode ? '#1E1E2E' : '#FFFFFF', chatBg: isDarkMode ? '#16161E' : '#F8F9FF',
        userBubble: '#6C5CE7', botBubble: isDarkMode ? '#252536' : '#F0EEFF', inputBg: isDarkMode ? '#252536' : '#F5F4FF',
    };

    const analysisScale = analysisOverlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
    const analysisOpacity = analysisOverlayAnim;

    return (
        <>
            {/* ===== ANALYSIS FULLSCREEN MODAL ===== */}
            {isAnalysisOpen && (
                <Modal transparent animationType="none" visible={isAnalysisOpen} onRequestClose={closeAnalysis}>
                    <View style={[analysisStyles.overlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(15,10,40,0.8)' }]}>
                        <Animated.View style={[
                            analysisStyles.analysisContainer,
                            {
                                opacity: analysisOpacity,
                                transform: [{ scale: analysisScale }],
                                maxWidth: isDesktop ? 900 : width - 20,
                                maxHeight: height - 60,
                                backgroundColor: isDarkMode ? '#12121C' : '#FAFAFF',
                            }
                        ]}>
                            {/* Header */}
                            <View style={[analysisStyles.analysisHeader, {
                                borderBottomColor: isDarkMode ? '#2A2A3E' : '#E8E6FF',
                            }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <View style={analysisStyles.headerRobot}>
                                        <Text style={{ fontSize: 28 }}>🤖</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[analysisStyles.analysisTitle, { color: isDarkMode ? '#FFF' : '#1A1A2E' }]}>
                                            AI Kunlik Analiz
                                        </Text>
                                        <Text style={[analysisStyles.analysisDate, { color: isDarkMode ? '#888' : '#999' }]}>
                                            📅 {analysisData.dateLabel}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={closeAnalysis}
                                    style={[analysisStyles.analysisCloseBtn, { backgroundColor: isDarkMode ? '#2A2A3E' : '#F0F0F5' }]}
                                >
                                    <Ionicons name="close" size={22} color={isDarkMode ? '#FFF' : '#333'} />
                                </TouchableOpacity>
                            </View>

                            {/* Fun fact banner */}
                            <View style={[analysisStyles.funFactBanner, {
                                backgroundColor: isDarkMode ? '#6C5CE715' : '#6C5CE710',
                                borderColor: isDarkMode ? '#6C5CE730' : '#6C5CE720',
                            }]}>
                                <Text style={[analysisStyles.funFactText, { color: isDarkMode ? '#A29BFE' : '#6C5CE7' }]}>
                                    {analysisData.randomFact}
                                </Text>
                            </View>

                            {/* Cards */}
                            <ScrollView
                                contentContainerStyle={analysisStyles.cardsContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={[analysisStyles.cardsGrid, { flexDirection: isDesktop ? 'row' : 'column', flexWrap: isDesktop ? 'wrap' : 'nowrap' }]}>
                                    {analysisData.cards.map((item, index) => (
                                        <View key={index} style={{ width: isDesktop ? '48%' : '100%' }}>
                                            <AnalysisCard item={item} index={index} isDarkMode={isDarkMode} theme={theme} />
                                        </View>
                                    ))}
                                </View>

                                {/* ===== AI TAKLIFLAR (RECOMMENDATIONS) ===== */}
                                {analysisData.recommendations.length > 0 && (
                                    <View style={analysisStyles.recommendationsSection}>
                                        <View style={analysisStyles.recHeaderRow}>
                                            <Text style={{ fontSize: 20 }}>🧠</Text>
                                            <Text style={[analysisStyles.recSectionTitle, { color: isDarkMode ? '#FFF' : '#1A1A2E' }]}>
                                                AI Takliflar
                                            </Text>
                                            <View style={[analysisStyles.recBadge, { backgroundColor: '#6C5CE720' }]}>
                                                <Text style={{ color: '#6C5CE7', fontSize: 11, fontWeight: '700' }}>
                                                    {analysisData.recommendations.length} ta
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[analysisStyles.recSubtitle, { color: isDarkMode ? '#777' : '#999' }]}>
                                            Ma'lumotlaringiz asosida tayyorlangan takliflar:
                                        </Text>

                                        {analysisData.recommendations.map((rec, idx) => (
                                            <RecommendationCard
                                                key={idx}
                                                item={rec}
                                                index={idx}
                                                totalCards={analysisData.cards.length}
                                                isDarkMode={isDarkMode}
                                            />
                                        ))}
                                    </View>
                                )}

                                {/* Footer */}
                                <View style={analysisStyles.analysisFooter}>
                                    <Text style={{ fontSize: 18 }}>🤖</Text>
                                    <Text style={[analysisStyles.footerText, { color: isDarkMode ? '#666' : '#AAA' }]}>
                                        Pro Teach AI tomonidan tayyorlangan
                                    </Text>
                                </View>
                            </ScrollView>
                        </Animated.View>
                    </View>
                </Modal>
            )}

            {/* ===== MAIN BOT UI ===== */}
            <View style={[styles.container, { right: isDesktop ? 30 : 15, bottom: isDesktop ? 30 : 15 }]} pointerEvents="box-none">
                {/* Chat Panel */}
                {isOpen && (
                    <Animated.View style={[styles.chatPanel, {
                        width: chatWidth, height: chatHeight, backgroundColor: botColors.surface,
                        borderColor: isDarkMode ? '#2D2D44' : '#E8E6FF',
                        transform: [{ translateY: chatTranslateY }], opacity: chatOpacity, bottom: 80, right: 0,
                    }]}>
                        {/* Chat Header */}
                        <View style={[styles.chatHeader, { backgroundColor: botColors.primary }]}>
                            <View style={styles.chatHeaderLeft}>
                                <View style={styles.chatHeaderAvatar}>
                                    <Text style={{ fontSize: 22 }}>🤖</Text>
                                </View>
                                <View>
                                    <Text style={styles.chatHeaderTitle}>Pro Teach AI</Text>
                                    <View style={styles.onlineStatus}>
                                        <View style={styles.onlineDot} />
                                        <Text style={styles.onlineText}>Online</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {/* ANALIZ Button */}
                                <TouchableOpacity
                                    onPress={openAnalysis}
                                    style={styles.analysisHeaderBtn}
                                >
                                    <Ionicons name="bar-chart" size={15} color="#FFF" />
                                    <Text style={styles.analysisHeaderBtnText}>Analiz</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={toggleChat} style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Messages */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={[styles.messagesContainer, { backgroundColor: botColors.chatBg }]}
                            contentContainerStyle={styles.messagesContent}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        >
                            {messages.map((msg) => (
                                <View key={msg.id} style={[
                                    styles.messageBubble,
                                    msg.isBot ? styles.botBubble : styles.userBubble,
                                    { backgroundColor: msg.isBot ? botColors.botBubble : botColors.userBubble }
                                ]}>
                                    {msg.isBot && <Text style={{ fontSize: 14, marginBottom: 4 }}>🤖</Text>}
                                    <Text style={[styles.messageText, { color: msg.isBot ? (isDarkMode ? '#E0DFFF' : '#2D2B55') : '#FFFFFF' }]}>
                                        {msg.text}
                                    </Text>
                                    <Text style={[styles.messageTime, { color: msg.isBot ? (isDarkMode ? '#888' : '#999') : 'rgba(255,255,255,0.7)' }]}>
                                        {msg.time}
                                    </Text>
                                </View>
                            ))}

                            {/* Quick Actions */}
                            {messages.length <= 1 && (
                                <View style={styles.quickActions}>
                                    <Text style={[styles.quickTitle, { color: isDarkMode ? '#AAA' : '#777' }]}>Tez savollar:</Text>

                                    {/* Analiz Quick Button */}
                                    <TouchableOpacity
                                        style={[styles.quickChip, {
                                            backgroundColor: '#6C5CE715',
                                            borderColor: '#6C5CE740',
                                            flexDirection: 'row', alignItems: 'center', gap: 8,
                                        }]}
                                        onPress={openAnalysis}
                                    >
                                        <Ionicons name="bar-chart" size={16} color="#6C5CE7" />
                                        <Text style={[styles.quickChipText, { color: '#6C5CE7' }]}>📊 Kunlik Analiz</Text>
                                    </TouchableOpacity>

                                    {QUICK_ACTIONS.map((action) => (
                                        <TouchableOpacity
                                            key={action.key}
                                            style={[styles.quickChip, {
                                                backgroundColor: botColors.inputBg,
                                                borderColor: isDarkMode ? '#3D3D55' : '#E0DEFF',
                                            }]}
                                            onPress={() => sendMessage(action.key)}
                                        >
                                            <Text style={[styles.quickChipText, { color: botColors.primary }]}>{action.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        {/* Input */}
                        <View style={[styles.inputContainer, { backgroundColor: botColors.surface, borderTopColor: isDarkMode ? '#2D2D44' : '#EAE8FF' }]}>
                            <View style={[styles.inputWrapper, { backgroundColor: botColors.inputBg }]}>
                                <TextInput
                                    style={[styles.input, { color: isDarkMode ? '#E0DFFF' : '#2D2B55' }]}
                                    placeholder="Savol yozing..."
                                    placeholderTextColor={isDarkMode ? '#666' : '#AAA'}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onSubmitEditing={() => sendMessage()}
                                    returnKeyType="send"
                                />
                                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: botColors.primary }]} onPress={() => sendMessage()}>
                                    <Ionicons name="send" size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Floating Bot Button */}
                <Animated.View style={{
                    transform: [{ translateY: floatAnim }, { rotate: wobbleRotation }, { scale: scaleAnim }],
                }}>
                    <Animated.View style={[styles.glowRing, { backgroundColor: botColors.glow, transform: [{ scale: pulseAnim }] }]} />
                    <TouchableOpacity
                        onPress={toggleChat}
                        activeOpacity={0.8}
                        style={[styles.botButton, { backgroundColor: isOpen ? botColors.accent : botColors.primary, shadowColor: botColors.primary }]}
                    >
                        {isOpen ? (
                            <Ionicons name="close" size={28} color="#FFF" />
                        ) : (
                            <View style={styles.robotFace}>
                                <View style={styles.antenna}>
                                    <View style={styles.antennaBase} />
                                    <View style={[styles.antennaBall, { backgroundColor: botColors.accent }]} />
                                </View>
                                <View style={styles.eyeRow}>
                                    <Animated.View style={[styles.eye, { transform: [{ scaleY: eyeBlinkAnim }] }]}>
                                        <View style={styles.eyePupil} />
                                    </Animated.View>
                                    <Animated.View style={[styles.eye, { transform: [{ scaleY: eyeBlinkAnim }] }]}>
                                        <View style={styles.eyePupil} />
                                    </Animated.View>
                                </View>
                                <View style={styles.mouth} />
                            </View>
                        )}
                    </TouchableOpacity>
                    {!isOpen && messages.length === 0 && (
                        <Animated.View style={[styles.notifBadge, { transform: [{ scale: pulseAnim }] }]}>
                            <Text style={styles.notifText}>?</Text>
                        </Animated.View>
                    )}
                </Animated.View>
            </View>
        </>
    );
};

// ========================================
// Styles
// ========================================
const styles = StyleSheet.create({
    container: { position: 'absolute', zIndex: 9999, alignItems: 'flex-end' },
    botButton: {
        width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
        elevation: 12, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 15,
    },
    glowRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, top: -8, left: -8 },
    robotFace: { alignItems: 'center', justifyContent: 'center' },
    antenna: { alignItems: 'center', position: 'absolute', top: -14 },
    antennaBase: { width: 2, height: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 },
    antennaBall: { width: 6, height: 6, borderRadius: 3, marginTop: -1 },
    eyeRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
    eye: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    eyePupil: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#2D2B55' },
    mouth: { width: 14, height: 7, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: 'rgba(255,255,255,0.8)', marginTop: 3 },
    notifBadge: { position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    notifText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    chatPanel: { position: 'absolute', borderRadius: 24, borderWidth: 1, overflow: 'hidden', elevation: 20, shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 30 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
    chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    chatHeaderTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    onlineStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#55EFC4' },
    onlineText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    analysisHeaderBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    analysisHeaderBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    messagesContainer: { flex: 1 },
    messagesContent: { padding: 14, paddingBottom: 8 },
    messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 18, marginBottom: 10 },
    botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
    userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
    messageText: { fontSize: 13.5, lineHeight: 20 },
    messageTime: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
    quickActions: { marginTop: 6, gap: 6 },
    quickTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    quickChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
    quickChipText: { fontSize: 13, fontWeight: '600' },
    inputContainer: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 6 : 4 },
    input: { flex: 1, fontSize: 14, paddingVertical: 8, ...(Platform.OS === 'web' && { outlineStyle: 'none' }) },
    sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

const analysisStyles = StyleSheet.create({
    overlay: {
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10,
    },
    analysisContainer: {
        borderRadius: 28, overflow: 'hidden', width: '100%',
        elevation: 25, shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 35,
    },
    analysisHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1,
    },
    headerRobot: {
        width: 50, height: 50, borderRadius: 18, backgroundColor: '#6C5CE718',
        alignItems: 'center', justifyContent: 'center',
    },
    analysisTitle: { fontSize: 22, fontWeight: '800' },
    analysisDate: { fontSize: 13, marginTop: 2 },
    analysisCloseBtn: {
        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    },
    funFactBanner: {
        marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 1,
    },
    funFactText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    cardsContainer: { padding: 20, paddingTop: 12 },
    cardsGrid: { gap: 12 },
    card: {
        borderRadius: 20, overflow: 'hidden', marginBottom: 4,
        borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10,
    },
    cardStrip: { height: 4 },
    cardContent: { padding: 18 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    cardValue: { fontSize: 22, fontWeight: '800' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    progressContainer: { marginTop: 14 },
    progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    progressText: { fontSize: 11, marginTop: 5, fontWeight: '500' },
    cardDetail: { fontSize: 12, marginTop: 10, fontWeight: '500' },
    analysisFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 20, marginTop: 8,
    },
    footerText: { fontSize: 12, fontWeight: '500' },

    // Recommendation styles
    recommendationsSection: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#6C5CE720',
    },
    recHeaderRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4,
    },
    recSectionTitle: {
        fontSize: 20, fontWeight: '800', flex: 1,
    },
    recBadge: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    recSubtitle: {
        fontSize: 12, fontWeight: '500', marginBottom: 16,
    },
    recCard: {
        borderRadius: 18, padding: 18, marginBottom: 12,
        borderWidth: 1, borderLeftWidth: 4,
        elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
    },
    recCardTop: {
        flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
    },
    recIconCircle: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    recTitle: {
        fontSize: 15, fontWeight: '700', marginBottom: 4,
    },
    recPriorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    recText: {
        fontSize: 13, lineHeight: 20, fontWeight: '500',
    },
    recBottomLine: {
        height: 3, borderRadius: 2, marginTop: 14, overflow: 'hidden',
    },
    recBottomLineFill: {
        height: '100%', borderRadius: 2,
    },
});

export default AiAssistantBot;
