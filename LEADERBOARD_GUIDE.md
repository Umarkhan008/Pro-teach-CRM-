# Reyting (Leaderboard) Funksiyasi - Tez Ma'lumot

## ✅ Qo'shilgan Yangiliklar

### 1. Leaderboard Screen
**Fayl:** `src/screens/student/LeaderboardScreen.jsx`

**Imkoniyatlar:**
- 📊 Barcha o'quvchilar reytingi
- 🏆 Top 3 uchun medal (oltin, kumush, bronza)
- 👤 Joriy foydalanuvchi ajratib ko'rsatiladi
- 📍 O'z o'rningizni alohida ko'rish
- 🎨 Yangi design system bilan chiroyli ko'rinish
- ⚡ Optimizatsiya qilingan (FlatList performance)

---

## 🎨 Dizayn Xususiyatlari (Yangilangan)

### Premium UI
- **Podium Tizimi:** Top 3 o'quvchi uchun maxsus podium ko'rinishi (1-o'rin markazda, baland).
- **Filtrlar:** Haftalik, Oylik va Umumiy reytingni ko'rish imkoniyati.
- **Trendlar:** O'sish yoki pasayish ko'rsatkichlari (mock data bilan).
- **Statistika Kartasi:** Foydalanuvchi uchun alohida karta, unda jami o'quvchilar orasidagi o'rni va bali aniq ko'rsatilgan.
- **Glassmorphism:** Zamonaviy shaffof elementlar va gradientlar.

### Medallar va Ranglar
- 🥇 **1-o'rin:** Oltin toj va podium
- 🥈 **2-o'rin:** Kumush podium
- 🥉 **3-o'rin:** Bronza podium

### Funksionallik
- **Vaqt Filtrlari:** (Haftalik, Oylik, Umumiy) - Hozirda simulyatsiya qilingan ma'lumotlar bilan ishlaydi.
- **Shaxsiy Statistika:** O'zingizning o'rningizni osongina topish uchun yuqorida mahkamlangan karta.

---

## 📱 Navigatsiya

---

## 📱 Navigatsiya

### Mobile Tab Bar
```
Home → MyCourses → 🏆 Reyting → Schedule → Payments
```

**Icon:** Trophy (🏆)

### Web Navigation (Desktop Student)
Leaderboard screen `StudentWebNavigator` da mavjud

---

## 💾 Ma'lumotlar Tuzilishi

### Student Object
```javascript
{
    id: "student_id",
    name: "O'quvchi Ismi",
    email: "email@example.com",
    avatar: "https://...", // agar mavjud bo'lsa
    rating: 0,  // ← Yangi field (hozircha default 0)
}
```

### Ranking Logic
```javascript
// O'quvchilar ball bo'yicha saralanadi
sorted by: rating (yuqoridan pastga)
rank: 1, 2, 3, ...
```

---

## 🔄 Keyingi Qadamlar

### Ball (Rating) Tizimini Qo'shish

**Ball qayerdan kelishi mumkin:**

#### 1. Davomatga asoslangan
```javascript
// Har bir darsga kelganlik uchun +1 ball
rating += 1  // har safar darsga kelsa
```

#### 2. To'lovga asoslangan (o'z vaqtida to'lagan)
```javascript
// O'z vaqtida to'lov +5 ball
rating += 5  // to'lov sanasida yoki oldinroq
```

#### 3. Imtihon natijalariga asoslangan
```javascript
// Imtihon ballari
rating += exam_score  // 0-100 ball
```

#### 4. Topshiriqlar (homework/tasks)
```javascript
// Topshiriq bajarilsa
rating += 3  // har bir topshiriq uchun
```

#### 5. Faoliyatga asoslangan
```javascript
// Darsda faol qatnashish
rating += teacher_bonus  // o'qituvchi beradi
```

---

## 🛠️ Implementatsiya Yo'riqnomasi

### 1. Firestore ga Rating qo'shish

```javascript
// SchoolContext.js da
const updateStudentRating = async (studentId, points) => {
    try {
        const studentRef = doc(db, 'students', studentId);
        await updateDoc(studentRef, {
            rating: increment(points)  // Mavjud balga qo'shadi
        });
        showToast(`${points} ball qo'shildi!`, 'success');
    } catch (error) {
        console.error('Rating update error:', error);
        showToast('Xatolik yuz berdi', 'error');
    }
};
```

### 2. Davomat belgilashda ball qo'shish

```javascript
// AttendanceScreen.jsx da
const markAttendance = async (studentId, status) => {
    // ... davomat saqlash
    
    if (status === 'present') {
        // Darsga kelgan uchun ball qo'shish
        await updateStudentRating(studentId, 1);
    }
};
```

### 3. To'lov qabul qilishda ball qo'shish

```javascript
// FinanceScreen.jsx da
const addPayment = async (studentId, amount, dueDate) => {
    // ... to'lovni saqlash
    
    const today = new Date();
    if (today <= new Date(dueDate)) {
        // O'z vaqtida to'lagan uchun bonus
        await updateStudentRating(studentId, 5);
    }
};
```

### 4. Manual ball qo'shish (admin)

```javascript
// StudentDetailScreen.jsx da
const addBonusPoints = async (points, reason) => {
    await updateStudentRating(student.id, points);
    
    // Audit log
    await addDoc(collection(db, 'rating_history'), {
        studentId: student.id,
        points: points,
        reason: reason,
        addedBy: userInfo.id,
        timestamp: serverTimestamp()
    });
};
```

---

## 📊 Rating History (Tarix)

### Firestore Collection: `rating_history`
```javascript
{
    id: "auto_generated",
    studentId: "student_id",
    points: 5,                    // +5 yoki -2
    reason: "darsga kelish",      // sabab
    relatedTo: "attendance_id",   // bog'liq hujjat ID
    addedBy: "admin_id",
    type: "attendance" | "payment" | "exam" | "bonus" | "penalty",
    timestamp: Timestamp
}
```

### History ko'rsatish (StudentDetailScreen)
```javascript
const RatingHistory = ({ studentId }) => {
    const [history, setHistory] = useState([]);
    
    useEffect(() => {
        const q = query(
            collection(db, 'rating_history'),
            where('studentId', '==', studentId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        
        const unsub = onSnapshot(q, (snap) => {
            setHistory(snap.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            })));
        });
        
        return () => unsub();
    }, [studentId]);
    
    return (
        <FlatList
            data={history}
            renderItem={({ item }) => (
                <Card>
                    <Text>{item.reason}</Text>
                    <Text>{item.points > 0 ? '+' : ''}{item.points} ball</Text>
                    <Text>{formatDate(item.timestamp)}</Text>
                </Card>
            )}
        />
    );
};
```

---

## 🎯 Ball Tizimi Tavsiyalari

### Belgilangan Qoidalar

| Faoliyat | Ball | Sabab |
|----------|------|-------|
| Darsga kelish | +1 | Har safar present |
| Kechikish | 0 | Sababsiz kechikish |
| O'z vaqtida to'lov | +5 | Muddat ichida |
| Kech to'lov | +2 | Muddatdan keyin |
| Imtihon (90-100%) | +10 | A'lo natija |
| Imtihon (70-89%) | +5 | Yaxshi |
| Imtihon (50-69%) | +2 | Qoniqarli |
| Topshiriq bajarish | +3 | Har bir topshiriq |
| O'qituvchi bonusi | +1 to +10 | Manual |
| Qoidabuzarlik | -5 | Jazo |

---

## 🔐 Security & Validation

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Rating faqat admin o'zgartirishi mumkin
    match /students/{studentId} {
      allow update: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['rating']);
    }
    
    // Rating history - faqat qo'shish, o'chirish yo'q
    match /rating_history/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update, delete: if false;  // Hech kim o'zgartira/o'chira olmaydi
    }
  }
}
```

---

## 📈 Dashboard Integration

### Admin Dashboard ga qo'shish

```javascript
// DashboardScreen.jsx
const TopStudents = () => {
    const { students } = useContext(SchoolContext);
    
    const topStudents = useMemo(() => {
        return [...students]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5);  // Top 5
    }, [students]);
    
    return (
        <Card>
            <Text style={TYPOGRAPHY.h4}>🏆 Top O'quvchilar</Text>
            {topStudents.map((student, index) => (
                <View key={student.id}>
                    <Text>{index + 1}. {student.name}</Text>
                    <Text>{student.rating || 0} ball</Text>
                </View>
            ))}
        </Card>
    );
};
```

---

## ✅ Qo'llanma Summary

### Hozir Ishlaydigan
- ✅ Leaderboard screen yaratildi
- ✅ Navigatsiya qo'shildi (mobile + web)
- ✅ Trophy icon qo'shildi
- ✅ Barcha o'quvchilar ko'rsatiladi
- ✅ Rank (o'rin) beriladi
- ✅ Joriy foydalanuvchi highlight
- ✅ Medal (top 3)
- ✅ Dark mode support

### Keyingi Implementatsiya Kerak
- ⬜ Rating field Firestore da
- ⬜ Ball qo'shish funksiyalari
- ⬜ Rating history collection
- ⬜ Admin panel (manual ball qo'shish)
- ⬜ Dashboard integration
- ⬜ Firestore security rules

---

## 🎨 Screenshot Tavsifi

**Leaderboard Screen ko'rinishi:**
```
┌────────────────────────────────┐
│ Reyting                         │
│ Barcha o'quvchilar reytingi    │
│                                 │
│ SIZNING O'RNINGIZ               │
│ ┌──────────────────────────┐  │
│ │  5    Sizning Ismingiz    │  │
│ │       45 ball             │  │
│ └──────────────────────────┘  │
│                                 │
│ BARCHA O'QUVCHILAR             │
│ ┌──────────────────────────┐  │
│ │ 🥇 1  Ali Valiyev  100 ball│  │
│ │ 🥈 2  Vali Aliyev  95 ball │  │
│ │ 🥉 3  Sobir Aziz   90 ball │  │
│ │  4  Jasur Karim   85 ball  │  │
│ │  5  Sizning Ismi  45 ball  │  │ ← Highlight (coral red)
│ │  6  Olim Ilmiy    40 ball  │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

---

**Status:** ✅ Leaderboard funksiyasi tayyor!  
**Keyingi qadam:** Ball tizimini implementatsiya qilish
