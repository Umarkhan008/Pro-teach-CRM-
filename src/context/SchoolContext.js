import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { mockData } from '../data/mockData';
import { db } from '../config/firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDocs,
    where,
    writeBatch,
    setDoc,
    increment,
    limit,
    startAfter,
    getDoc
} from 'firebase/firestore';
import { SETTINGS } from '../config/settings';

/**
 * FIRESTORE INDEXING GUIDE (Required for performance):
 * Collection 'finance' -> date (DESC), createdAt (DESC)
 * Collection 'activities' -> createdAt (DESC)
 * Collection 'attendance' -> date (DESC), createdAt (DESC)
 * Collection 'leads' -> createdAt (DESC)
 * Collection 'students' -> name (ASC)
 */

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [finance, setFinance] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [leads, setLeads] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [videos, setVideos] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [appSettings, setAppSettings] = useState({
        googleSheetsUrl: SETTINGS.GOOGLE_SHEETS_URL || '',
        googleSheetsViewUrl: '',
        enableGoogleSheets: SETTINGS.ENABLE_GOOGLE_SHEETS || false,
        attendanceFormat: 'simple'
    });

    // --- Performance State ---
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        activeLeads: 0
    });
    const [lastDocs, setLastDocs] = useState({
        finance: null,
        attendance: null,
        activities: null
    });
    const [hasMore, setHasMore] = useState({
        finance: true,
        attendance: true,
        activities: true
    });
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        let studentsLoaded = false;
        let teachersLoaded = false;
        let coursesLoaded = false;

        const checkAllLoaded = () => {
            if (studentsLoaded && teachersLoaded && coursesLoaded) {
                // Small delay to ensure smooth transition
                setTimeout(() => {
                    setIsDataLoaded(true);
                }, 500);
            }
        };

        // 1. Real-time Listeners for small collections
        const unsubStudents = onSnapshot(query(collection(db, 'students'), orderBy('name'), limit(200)), (snap) => {
            setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            studentsLoaded = true;
            checkAllLoaded();
        });

        const unsubTeachers = onSnapshot(query(collection(db, 'teachers'), orderBy('name')), (snap) => {
            setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            teachersLoaded = true;
            checkAllLoaded();
        });

        const unsubCourses = onSnapshot(query(collection(db, 'courses'), orderBy('title')), (snap) => {
            setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            coursesLoaded = true;
            checkAllLoaded();
        });

        const unsubSubjects = onSnapshot(query(collection(db, 'subjects'), orderBy('title')), (snap) => {
            setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubRooms = onSnapshot(query(collection(db, 'rooms'), orderBy('name')), (snap) => {
            setRooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. Initial Page for Paginated collections (Finance, Attendance, Activities)
        const unsubFinance = onSnapshot(query(collection(db, 'finance'), orderBy('date', 'desc'), limit(20)), (snap) => {
            setFinance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (!snap.empty) setLastDocs(prev => ({ ...prev, finance: snap.docs[snap.docs.length - 1] }));
        });

        const unsubActivities = onSnapshot(query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(20)), (snap) => {
            setRecentActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (!snap.empty) setLastDocs(prev => ({ ...prev, activities: snap.docs[snap.docs.length - 1] }));
        });

        const unsubAttendance = onSnapshot(query(collection(db, 'attendance'), orderBy('date', 'desc'), limit(20)), (snap) => {
            setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (!snap.empty) setLastDocs(prev => ({ ...prev, attendance: snap.docs[snap.docs.length - 1] }));
        });

        const unsubLeads = onSnapshot(query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
            setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubSettings = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
            const data = docSnap.exists() ? docSnap.data() : {};
            setAppSettings({
                googleSheetsUrl: data.googleSheetsUrl || SETTINGS.GOOGLE_SHEETS_URL || '',
                enableGoogleSheets: data.enableGoogleSheets ?? SETTINGS.ENABLE_GOOGLE_SHEETS ?? false,
                attendanceFormat: data.attendanceFormat || 'simple'
            });
        });

        const unsubVideos = onSnapshot(query(collection(db, 'videos'), orderBy('createdAt', 'desc')), (snap) => {
            setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubStats = onSnapshot(doc(db, 'settings', 'stats'), (docSnap) => {
            if (docSnap.exists()) setStats(docSnap.data());
        });

        return () => {
            unsubStudents(); unsubTeachers(); unsubCourses(); unsubSubjects(); unsubRooms();
            unsubFinance(); unsubActivities(); unsubAttendance(); unsubLeads();
            unsubSettings(); unsubStats(); unsubVideos();
        };
    }, []);

    // --- Performance Helpers ---
    const updateGlobalStats = useCallback(async (updates, batch = null) => {
        try {
            const statsRef = doc(db, 'settings', 'stats');
            if (batch) {
                batch.set(statsRef, updates, { merge: true });
            } else {
                await setDoc(statsRef, updates, { merge: true });
            }
        } catch (e) {
            console.error("Error updating stats:", e);
        }
    }, []);

    const loadMoreFinance = async () => {
        if (!lastDocs.finance || !hasMore.finance) return;
        try {
            const q = query(collection(db, 'finance'), orderBy('date', 'desc'), startAfter(lastDocs.finance), limit(20));
            const snap = await getDocs(q);
            if (snap.empty) {
                setHasMore(prev => ({ ...prev, finance: false }));
                return;
            }
            const newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFinance(prev => [...prev, ...newData]);
            setLastDocs(prev => ({ ...prev, finance: snap.docs[snap.docs.length - 1] }));
        } catch (e) { console.error("Load more finance error:", e); }
    };

    // --- Activities ---
    const addActivity = async (action, target) => {
        try {
            await addDoc(collection(db, 'activities'), {
                name: 'Admin',
                action: 'Action',
                target: action,
                time: new Date().toLocaleTimeString(),
                createdAt: serverTimestamp(),
                icon: 'notifications-outline'
            });
        } catch (e) {
            console.error("Error adding activity: ", e);
        }
    };

    // --- Students CRUD ---
    const addStudent = async (student) => {
        try {
            const batch = writeBatch(db);
            const studentRef = doc(collection(db, 'students'));
            batch.set(studentRef, student);

            updateGlobalStats({ totalStudents: increment(1) }, batch);
            await batch.commit();

            addActivity(`Added new student: ${student.name}`, 'System');
        } catch (e) {
            console.error("Error adding student: ", e);
        }
    };

    const updateStudent = async (id, updatedData) => {
        try {
            const studentRef = doc(db, 'students', id);
            await updateDoc(studentRef, updatedData);
        } catch (e) {
            console.error("Error updating student: ", e);
        }
    };

    const deleteStudent = async (id) => {
        try {
            await deleteDoc(doc(db, 'students', id));
            // Update stats independently
            updateGlobalStats({ totalStudents: increment(-1) });
        } catch (e) {
            console.error("Error deleting student: ", e);
            Alert.alert("Xatolik", "O'quvchini o'chirishda xatolik yuz berdi");
            throw e;
        }
    };

    // --- Teachers CRUD ---
    const addTeacher = async (teacher) => {
        try {
            const batch = writeBatch(db);
            const ref = doc(collection(db, 'teachers'));
            batch.set(ref, teacher);
            updateGlobalStats({ totalTeachers: increment(1) }, batch);
            await batch.commit();
            addActivity(`Added new teacher: ${teacher.name}`, 'System');
        } catch (e) {
            console.error("Error adding teacher: ", e);
        }
    };

    const deleteTeacher = async (id) => {
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'teachers', id));
            updateGlobalStats({ totalTeachers: increment(-1) }, batch);
            await batch.commit();
        } catch (e) {
            console.error("Error deleting teacher: ", e);
        }
    };

    const updateTeacher = async (id, updatedData) => {
        try {
            const teacherRef = doc(db, 'teachers', id);
            await updateDoc(teacherRef, updatedData);
            addActivity(`Updated teacher: ${updatedData.name}`, 'System');
        } catch (e) {
            console.error("Error updating teacher: ", e);
        }
    };

    // --- Courses CRUD ---
    const addCourse = async (course) => {
        try {
            const batch = writeBatch(db);
            const ref = doc(collection(db, 'courses'));
            batch.set(ref, course);
            updateGlobalStats({ totalCourses: increment(1) }, batch);
            await batch.commit();
            addActivity(`Created new course: ${course.title}`, 'System');
        } catch (e) {
            console.error("Error adding course: ", e);
        }
    };

    const updateCourse = async (id, updatedData) => {
        try {
            const courseRef = doc(db, 'courses', id);
            await updateDoc(courseRef, updatedData);

            // If title changed, update all students
            if (updatedData.title) {
                const q = query(collection(db, 'students'), where('assignedCourseId', '==', id));
                const querySnapshot = await getDocs(q);

                const batch = writeBatch(db);
                querySnapshot.forEach((docSnap) => {
                    batch.update(doc(db, 'students', docSnap.id), {
                        course: updatedData.title
                    });
                });
                if (!querySnapshot.empty) {
                    await batch.commit();
                }
            }

            addActivity(`Updated course: ${updatedData.title}`, 'System');
        } catch (e) {
            console.error("Error updating course: ", e);
        }
    };

    const deleteCourse = async (id) => {
        try {
            const q = query(collection(db, 'students'), where('assignedCourseId', '==', id));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);

            querySnapshot.forEach((docSnap) => {
                batch.update(doc(db, 'students', docSnap.id), {
                    assignedCourseId: null,
                    course: 'Not Assigned',
                    status: 'Pending'
                });
            });

            batch.delete(doc(db, 'courses', id));
            updateGlobalStats({ totalCourses: increment(-1) }, batch);
            await batch.commit();

            addActivity(`Deleted course and unassigned ${querySnapshot.size} students`, 'System');
        } catch (e) {
            console.error("Error deleting course: ", e);
        }
    };

    // --- Schedule CRUD ---
    const addClass = async (classItem) => {
        try {
            await addDoc(collection(db, 'schedule'), classItem);
            addActivity(`Added class: ${classItem.title}`, 'System');
        } catch (e) {
            console.error("Error adding class: ", e);
        }
    };

    const deleteClass = async (id) => {
        try {
            await deleteDoc(doc(db, 'schedule', id));
        } catch (e) {
            console.error("Error deleting class: ", e);
        }
    };

    // --- Finance ---
    const addTransaction = async (transaction) => {
        try {
            const amountVal = parseFloat(transaction.amount.replace(/[^0-9.-]+/g, ""));
            const batch = writeBatch(db);

            const transRef = doc(collection(db, 'finance'));
            const data = {
                ...transaction,
                date: new Date().toLocaleDateString(),
                createdAt: serverTimestamp()
            };
            batch.set(transRef, data);

            updateGlobalStats({ totalRevenue: increment(amountVal) }, batch);
            await batch.commit();

            addActivity(`Added transaction: ${transaction.title}`, 'System');
            syncWithGoogleSheets(data, 'finance');
        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            // Need amount to update stats
            const transSnap = await getDoc(doc(db, 'finance', id));
            if (transSnap.exists()) {
                const amountVal = parseFloat(transSnap.data().amount.replace(/[^0-9.-]+/g, ""));
                const batch = writeBatch(db);
                batch.delete(doc(db, 'finance', id));
                updateGlobalStats({ totalRevenue: increment(-amountVal) }, batch);
                await batch.commit();
            }
        } catch (e) {
            console.error("Error deleting transaction: ", e);
        }
    };

    // --- Leads CRUD ---
    const addLead = async (lead) => {
        try {
            const batch = writeBatch(db);
            const ref = doc(collection(db, 'leads'));
            const data = {
                ...lead,
                createdAt: serverTimestamp(),
                status: 'New'
            };
            batch.set(ref, data);
            updateGlobalStats({ activeLeads: increment(1) }, batch);
            await batch.commit();
            addActivity(`Added new lead: ${lead.name}`, 'System');
            syncWithGoogleSheets(data, 'lead');
        } catch (e) {
            console.error("Error adding lead: ", e);
        }
    };

    const updateLead = async (id, updatedData) => {
        try {
            const leadRef = doc(db, 'leads', id);
            await updateDoc(leadRef, updatedData);
            // If status changed to enrolled, maybe auto-add to students? (Can be done in UI)
        } catch (e) {
            console.error("Error updating lead: ", e);
        }
    };

    const deleteLead = async (id) => {
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'leads', id));
            updateGlobalStats({ activeLeads: increment(-1) }, batch);
            await batch.commit();
        } catch (e) {
            console.error("Error deleting lead: ", e);
        }
    };

    // --- Subjects (Templates) CRUD ---
    const addSubject = async (subject) => {
        try {
            await addDoc(collection(db, 'subjects'), subject);
            addActivity(`Created course template: ${subject.title}`, 'System');
        } catch (e) {
            console.error("Error adding subject: ", e);
        }
    };

    const updateSubject = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'subjects', id), updatedData);
        } catch (e) {
            console.error("Error updating subject: ", e);
        }
    };

    const deleteSubject = async (id) => {
        try {
            await deleteDoc(doc(db, 'subjects', id));
        } catch (e) {
            console.error("Error deleting subject: ", e);
        }
    };

    // --- Rooms CRUD ---
    const addRoom = async (room) => {
        try {
            await addDoc(collection(db, 'rooms'), room);
            addActivity(`Added new room: ${room.name}`, 'System');
        } catch (e) {
            console.error("Error adding room: ", e);
        }
    };

    const updateRoom = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'rooms', id), updatedData);
        } catch (e) {
            console.error("Error updating room: ", e);
        }
    };

    const deleteRoom = async (id) => {
        try {
            await deleteDoc(doc(db, 'rooms', id));
        } catch (e) {
            console.error("Error deleting room: ", e);
        }
    };

    // --- Videos CRUD ---
    const addVideo = async (videoItem) => {
        try {
            const docRef = await addDoc(collection(db, 'videos'), {
                ...videoItem,
                createdAt: serverTimestamp()
            });
            addActivity(`Yangi video qo'shildi: ${videoItem.title}`, 'System');
            return docRef.id;
        } catch (e) {
            console.error("Error adding video: ", e);
            return null;
        }
    };

    const deleteVideo = async (id) => {
        try {
            await deleteDoc(doc(db, 'videos', id));
        } catch (e) {
            console.error("Error deleting video: ", e);
        }
    };

    const updateVideo = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'videos', id), updatedData);
        } catch (e) {
            console.error("Error updating video: ", e);
        }
    };

    const updateAppSettings = async (newSettings) => {
        try {
            // Optimistic update
            setAppSettings(prev => ({ ...prev, ...newSettings }));

            const settingsRef = doc(db, 'settings', 'app');
            await setDoc(settingsRef, newSettings, { merge: true });
            addActivity('Updated Google Sheets settings', 'System');
        } catch (e) {
            console.error("Error updating settings: ", e);
            Alert.alert("Xatolik", "Sozlamalarni saqlashda xatolik yuz berdi");
        }
    };

    const syncWithGoogleSheets = async (data, type = 'attendance') => {
        // Effective URL: DB > Settings File
        const url = appSettings.googleSheetsUrl || SETTINGS.GOOGLE_SHEETS_URL;

        if (!appSettings.enableGoogleSheets || !url) {
            console.log("Google Sheets sync skipped (Disabled or No URL)");
            return;
        }

        // Check specifics 
        if (type === 'finance' && !appSettings.syncFinance) return;
        if (type === 'lead' && !appSettings.syncLeads) return;

        try {
            console.log(`[GoogleSheets] Preparing to sync ${type}...`);

            let payload = {
                type: type,
                timestamp: new Date().toISOString(),
                format: appSettings.attendanceFormat || 'simple',
                design: appSettings.design || {}
            };

            if (type === 'attendance') {
                // Ensure students is an array of objects with names
                const studentsWithNames = Object.entries(data.students || {}).map(([id, sData]) => {
                    // Try to find student in local state if name is missing
                    const student = students.find(s => String(s.id) === String(id));
                    return {
                        id: id,
                        name: sData.name || (student ? student.name : 'Noma\'lum'),
                        status: sData.status,
                        homework: sData.homework || '0',
                        note: sData.note || ''
                    };
                });

                payload = {
                    ...payload,
                    courseName: data.courseName || 'Davomat',
                    date: data.date,
                    students: studentsWithNames
                };
            } else if (type === 'finance') {
                payload = { ...payload, transaction: data };
            } else if (type === 'lead') {
                payload = { ...payload, lead: data };
            }

            console.log(`[GoogleSheets] Sending payload to: ${url.substring(0, 40)}...`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            const resultText = await response.text().catch(() => 'No response text');
            console.log("[GoogleSheets] Response Status:", response.status);
            console.log("[GoogleSheets] Response Text:", resultText);

            if (response.ok || response.status === 302 || response.status === 200 || resultText.includes("Success")) {
                console.log("[GoogleSheets] Sync successful");
            } else {
                console.warn("[GoogleSheets] Sync failed with status:", response.status);
                // We don't alert here to avoid annoying the user on every attendance if there's a temporary issue
                // but we logged it.
            }

        } catch (error) {
            console.error("[GoogleSheets] Sync Error:", error);
            // Only alert on critical connection errors if it's the first time or if user should know
        }
    };

    // --- Automatic Financial Deduction Engine ---
    const processDailyDeductions = async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().getDay();

        const isToday = (course) => {
            if (!course || !course.days) return false;
            const courseDaysStr = (course.days || '').toString().toUpperCase();
            if (courseDaysStr.includes('DCHJ') && [1, 3, 5].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('SPSH') && [2, 4, 6].includes(dayOfWeek)) return true;
            return courseDaysStr.includes('HAR KUNI');
        };

        try {
            for (const course of courses) {
                if (isToday(course) && course.time) {
                    const deductionId = `${course.id}_${todayStr}`;
                    const deductionRef = doc(db, 'dailyDeductions', deductionId);
                    const docSnap = await getDoc(deductionRef);

                    if (!docSnap.exists()) {
                        console.log(`Processing auto-deduction: ${course.title}`);

                        // Optimized: Query specific students instead of local filter
                        const qStudents = query(collection(db, 'students'), where('assignedCourseId', '==', course.id));
                        const studentsSnap = await getDocs(qStudents);

                        if (studentsSnap.empty) continue;

                        const batch = writeBatch(db);
                        const monthlyPrice = typeof course.price === 'string'
                            ? parseFloat(course.price.replace(/[^\d]/g, ''))
                            : course.price;
                        const dailyFee = Math.round(monthlyPrice / 12);

                        if (isNaN(dailyFee) || dailyFee <= 0) continue;

                        let totalDeducted = 0;
                        studentsSnap.forEach(sDoc => {
                            const student = sDoc.data();
                            const newBalance = (student.balance || 0) - dailyFee;
                            batch.update(doc(db, 'students', sDoc.id), { balance: newBalance });

                            const financeRef = doc(collection(db, 'finance'));
                            batch.set(financeRef, {
                                title: `${course.title} - Avtomatik to'lov`,
                                amount: `-${dailyFee}`,
                                type: 'Expense',
                                date: new Date().toLocaleDateString(),
                                studentId: sDoc.id,
                                createdAt: serverTimestamp()
                            });
                            totalDeducted += dailyFee;
                        });

                        batch.set(deductionRef, { date: todayStr, processedAt: serverTimestamp() });
                        updateGlobalStats({ totalRevenue: increment(-totalDeducted) }, batch);
                        await batch.commit();
                    }
                }
            }
        } catch (e) {
            console.error("Auto-deduction error:", e);
        }
    };

    // --- Attendance CRUD ---
    const saveAttendance = async (attendanceData) => {
        try {
            // Simply save attendance, financial deduction is now automated based on time
            await addDoc(collection(db, 'attendance'), {
                ...attendanceData,
                createdAt: serverTimestamp()
            });

            addActivity(`Davomat olindi: ${attendanceData.courseName} (${attendanceData.date})`, 'System');
            syncWithGoogleSheets(attendanceData);
            return true;
        } catch (e) {
            console.error("Error saving attendance: ", e);
            return false;
        }
    };

    const updateAttendance = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'attendance', id), updatedData);
            console.log("Attendance updated in Firestore successfully");

            // Sync with Google Sheets on update as well
            syncWithGoogleSheets(updatedData);
            return true;
        } catch (e) {
            console.error("Error updating attendance: ", e);
            return false;
        }
    };

    const loadMoreActivities = async () => {
        if (!lastDocs.activities || !hasMore.activities) return;
        try {
            const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), startAfter(lastDocs.activities), limit(20));
            const snap = await getDocs(q);
            if (snap.empty) { setHasMore(prev => ({ ...prev, activities: false })); return; }
            setRecentActivities(prev => [...prev, ...snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
            setLastDocs(prev => ({ ...prev, activities: snap.docs[snap.docs.length - 1] }));
        } catch (e) { console.error(e); }
    };

    const loadMoreAttendance = async () => {
        if (!lastDocs.attendance || !hasMore.attendance) return;
        try {
            const q = query(collection(db, 'attendance'), orderBy('date', 'desc'), startAfter(lastDocs.attendance), limit(20));
            const snap = await getDocs(q);
            if (snap.empty) { setHasMore(prev => ({ ...prev, attendance: false })); return; }
            setAttendance(prev => [...prev, ...snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
            setLastDocs(prev => ({ ...prev, attendance: snap.docs[snap.docs.length - 1] }));
        } catch (e) { console.error(e); }
    };

    // --- Dashboard Stats Computation ---
    const getDashboardStats = () => {
        const colors = mockData.stats || [{ color: '#667eea' }, { color: '#F2994A' }, { color: '#27AE60' }, { color: '#5865F2' }];

        return [
            {
                id: 1,
                title: 'Total Students',
                value: (stats.totalStudents || students.length).toString(),
                icon: 'people',
                color: colors[0]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
            {
                id: 2,
                title: 'Total Teachers',
                value: (stats.totalTeachers || teachers.length).toString(),
                icon: 'school',
                color: colors[1]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
            {
                id: 3,
                title: 'Active Courses',
                value: (stats.totalCourses || courses.length).toString(),
                icon: 'book',
                color: colors[2]?.color,
                trend: 'down',
                trendValue: '0%',
            },
            {
                id: 4,
                title: 'Total Revenue',
                value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
                icon: 'wallet',
                color: colors[3]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
        ];
    };

    const getTotalRevenue = () => {
        return `$${(stats.totalRevenue || 0).toLocaleString()}`;
    };

    return (
        <SchoolContext.Provider value={{
            students, addStudent, updateStudent, deleteStudent,
            teachers, addTeacher, updateTeacher, deleteTeacher,
            courses, addCourse, updateCourse, deleteCourse,
            finance, addTransaction, deleteTransaction, loadMoreFinance,
            schedule, setSchedule, addClass, deleteClass,
            leads, addLead, updateLead, deleteLead,
            subjects, addSubject, updateSubject, deleteSubject,
            rooms, addRoom, updateRoom, deleteRoom,
            attendance, saveAttendance, updateAttendance, loadMoreAttendance,
            videos, addVideo, deleteVideo, updateVideo,
            recentActivities, loadMoreActivities,
            appSettings, updateAppSettings,
            processDailyDeductions,
            getDashboardStats,
            getTotalRevenue,
            hasMore,
            isDataLoaded,
            revenueData: mockData.revenueData
        }}>
            {children}
        </SchoolContext.Provider>
    );
};
