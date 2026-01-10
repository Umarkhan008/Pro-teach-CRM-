import React, { createContext, useState, useEffect } from 'react';
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
    serverTimestamp
} from 'firebase/firestore';

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [finance, setFinance] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [leads, setLeads] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    // Helper to unsubscribe from listeners on unmount
    useEffect(() => {
        const qStudents = query(collection(db, 'students'), orderBy('name'));
        const unsubStudents = onSnapshot(qStudents, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qTeachers = query(collection(db, 'teachers'), orderBy('name'));
        const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
            setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qCourses = query(collection(db, 'courses'), orderBy('title'));
        const unsubCourses = onSnapshot(qCourses, (snapshot) => {
            setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qFinance = query(collection(db, 'finance'), orderBy('date', 'desc'));
        const unsubFinance = onSnapshot(qFinance, (snapshot) => {
            setFinance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qSchedule = query(collection(db, 'schedule'), orderBy('startTime'));
        const unsubSchedule = onSnapshot(qSchedule, (snapshot) => {
            setSchedule(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qActivities = query(collection(db, 'activities'), orderBy('createdAt', 'desc'));
        const unsubActivities = onSnapshot(qActivities, (snapshot) => {
            setRecentActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        const unsubLeads = onSnapshot(qLeads, (snapshot) => {
            setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubStudents();
            unsubTeachers();
            unsubCourses();
            unsubFinance();
            unsubSchedule();
            unsubActivities();
            unsubLeads();
        };
    }, []);

    // --- Activities ---
    const addActivity = async (action, target) => {
        try {
            await addDoc(collection(db, 'activities'), {
                name: 'Admin', // In a real app, use auth user
                action: 'Action',
                target: action,
                time: new Date().toLocaleTimeString(), // Simple time string for now
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
            await addDoc(collection(db, 'students'), student);
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
        } catch (e) {
            console.error("Error deleting student: ", e);
        }
    };

    // --- Teachers CRUD ---
    const addTeacher = async (teacher) => {
        try {
            await addDoc(collection(db, 'teachers'), teacher);
            addActivity(`Added new teacher: ${teacher.name}`, 'System');
        } catch (e) {
            console.error("Error adding teacher: ", e);
        }
    };

    const deleteTeacher = async (id) => {
        try {
            await deleteDoc(doc(db, 'teachers', id));
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
            await addDoc(collection(db, 'courses'), course);
            addActivity(`Created new course: ${course.title}`, 'System');
        } catch (e) {
            console.error("Error adding course: ", e);
        }
    };

    const updateCourse = async (id, updatedData) => {
        try {
            const courseRef = doc(db, 'courses', id);
            await updateDoc(courseRef, updatedData);
            addActivity(`Updated course: ${updatedData.title}`, 'System');
        } catch (e) {
            console.error("Error updating course: ", e);
        }
    };

    const deleteCourse = async (id) => {
        try {
            await deleteDoc(doc(db, 'courses', id));
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
            await addDoc(collection(db, 'finance'), {
                ...transaction,
                date: new Date().toLocaleDateString()
            });
            addActivity(`Added transaction: ${transaction.title}`, 'System');
        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'finance', id));
        } catch (e) {
            console.error("Error deleting transaction: ", e);
        }
    };

    // --- Leads CRUD ---
    const addLead = async (lead) => {
        try {
            await addDoc(collection(db, 'leads'), {
                ...lead,
                createdAt: serverTimestamp(),
                status: 'new' // new, contacted, enrolled, lost
            });
            addActivity(`Added new lead: ${lead.name}`, 'System');
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
            await deleteDoc(doc(db, 'leads', id));
        } catch (e) {
            console.error("Error deleting lead: ", e);
        }
    };

    // --- Dashboard Stats Computation ---
    const getDashboardStats = () => {
        // Safe access to mockData.stats to avoid crashes if it's structured differently
        const colors = mockData.stats || [{ color: '#000' }, { color: '#000' }, { color: '#000' }, { color: '#000' }];

        // Calculate total revenue from finance state
        const totalRev = finance.reduce((acc, item) => {
            const amount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(amount) ? 0 : amount);
        }, 0);

        return [
            {
                id: 1,
                title: 'Total Students',
                value: students.length.toString(),
                icon: 'people',
                color: colors[0]?.color,
                trend: 'up',
                trendValue: '+0%', // Dynamic calculation would ideally go here
            },
            {
                id: 2,
                title: 'Total Teachers',
                value: teachers.length.toString(),
                icon: 'school',
                color: colors[1]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
            {
                id: 3,
                title: 'Active Courses',
                value: courses.length.toString(),
                icon: 'book',
                color: colors[2]?.color,
                trend: 'down',
                trendValue: '0%',
            },
            {
                id: 4,
                title: 'Revenue',
                value: `$${totalRev.toLocaleString()}`,
                icon: 'wallet',
                color: colors[3]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
        ];
    };

    const getTotalRevenue = () => {
        const total = finance.reduce((acc, item) => {
            const amount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(amount) ? 0 : amount);
        }, 0);
        return `$${total.toLocaleString()}`;
    };

    return (
        <SchoolContext.Provider value={{
            students, addStudent, updateStudent, deleteStudent,
            teachers, addTeacher, updateTeacher, deleteTeacher,
            courses, addCourse, updateCourse, deleteCourse,
            finance, addTransaction, deleteTransaction,
            schedule, setSchedule, addClass, deleteClass,
            leads, addLead, updateLead, deleteLead,
            recentActivities,
            getDashboardStats,
            getTotalRevenue,
            revenueData: mockData.revenueData // Static for now
        }}>
            {children}
        </SchoolContext.Provider>
    );
};
