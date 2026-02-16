# 📱 Pro Teach Dashboard - Production'ga Chiqarish va Yangilash

## 🎯 Umumiy Ma'lumot

Bu qo'llanma sizga ilovani:
1. **Production APK** yaratishni (Google Play yoki to'g'ridan-to'g'ri tarqatish uchun)
2. **OTA (Over-The-Air) yangilanish** sozlashni - foydalanuvchilar ilovani qayta yuklamasdan yangilanishlarni oladi

---

## 📋 Bosqichlar

### 1️⃣ EAS Account yaratish

```bash
# EAS CLI allaqachon o'rnatilgan
# Endi login qiling:
eas login
```

**Eslatma:** Agar Expo account'ingiz yo'q bo'lsa:
- https://expo.dev saytiga o'ting
- Sign Up qiling
- Email tasdiqlang

---

### 2️⃣ Birinchi Marta Build Konfiguratsiya

```bash
# EAS build sozlash (birinchi marta)
eas build:configure
```

Bu sizning `eas.json` va `app.json` fayllaringizni tekshiradi.
Hammasi tayyor bo'lsa, davom eting.

---

### 3️⃣ Android APK yaratish

#### A) **Preview Build** (Test uchun - tezroq)

```bash
eas build --platform android --profile preview
```

**Nima bo'ladi:**
- ✅ APK fayl yaratiladi (5-15 daqiqa)
- ✅ To'g'ridan-to'g'ri Android qurilmalarga o'rnatish mumkin
- ✅ Google Play'ga joylashni talab qilmaydi

#### B) **Production Build** (Google Play uchun)

```bash
eas build --platform android --profile production
```

**Nima bo'ladi:**
- ✅ AAB (Android App Bundle) yaratiladi
- ✅ Google Play Store'ga yuklash uchun
- ✅ Avtomatik versiya increment

---

### 4️⃣ Build Jarayonini Kuzatish

Build boshlanganidan keyin:

1. **Browser'da ochiladi**: https://expo.dev/accounts/[USERNAME]/projects/pro-teach-dashboard/builds
2. **Terminal'da progress**: Real-time log ko'rsatiladi
3. **Tayyor bo'lganda**: Download link keladi

**Build vaqti:** Odatda 10-20 daqiqa

---

### 5️⃣ APK'ni Yuklab Olish va O'rnatish

Build tugaganidan keyin:

```bash
# QR code skan qiling yoki havolaga o'ting
# APK'ni yuklab oling
```

**Android qurilmada:**
1. APK faylini yuklang
2. "Install from Unknown Sources" ruxsatini bering
3. O'rnating va ishga tushiring!

---

## 🔄 OTA Yangilash (Havoda Yangilash)

### Nima uchun OTA?

- ✅ **Tezkor yangilanish** - 5 daqiqada deploy
- ✅ **Foydalanuvchilar bilmaydi** - avtomatik yangilanadi
- ✅ **Google Play kutishsiz** - bir necha soniyada yangi versiya
- ⚠️ **Cheklov:** Faqat JavaScript/React code. Native kod (Java/Kotlin) o'zgarmaydi

### OTA Update Yuborish

#### 1. Kodda o'zgarish qiling:

```javascript
// Masalan: DashboardScreen.jsx da
<Text>Yangi xususiyat!</Text>
```

#### 2. Update yarating:

```bash
# Production channel'ga yangilash
eas update --branch production --message "Dashboard yangilandi"
```

#### 3. Tasdiqlang:

Terminal'da:
```
✅ Update published!
✅ Branch: production
✅ Runtime version: 1.0.0
```

#### 4. Foydalanuvchilar tomonidan:

- Ilova **yopilganda** yangilanish yuklanadi
- **Keyingi ochilganda** yangi kod ishlaydi
- Hech qanday store approval kerak emas!

---

## 📊 Versiya Boshqarish

### Kichik o'zgarishlar (OTA):

```bash
# JavaScript/React kod o'zgarishida
eas update --branch production --message "Bug fix"
```

### Katta o'zgarishlar (Yangi APK):

1. `app.json`'da versiyani oshiring:

```json
{
  "expo": {
    "version": "1.1.0"  // 1.0.0 dan 1.1.0 ga
  }
}
```

2. Yangi build yarating:

```bash
eas build --platform android --profile production
```

---

## 🚀 To'liq Workflow

### Birinchi Deploy:

```bash
# 1. Login
eas login

# 2. APK yaratish
eas build --platform android --profile preview

# 3. Yuklab oling va tarqating
# Browser'dagi link orqali
```

### Keyingi Yangilanishlar:

```bash
# JavaScript o'zgarishda (OTA):
eas update --branch production --message "Yangi funksiya"

# Native o'zgarishda (yangi build):
eas build --platform android --profile preview
```

---

## 🔐 Muhim Eslatmalar

### OTA Ishlashi Uchun:

✅ `app.json`'da `updates.url` bor (✅ sizda bor)
✅ `runtimeVersion` sozlangan (✅ sizda bor)
✅ `extra.eas.projectId` bor (✅ sizda bor)

### OTA Ishlamaydigan Holatlar:

❌ Native kod o'zgardi (`package.json`'da dependency qo'shildi)
❌ `app.json`'da native config o'zgardi
❌ Build versiyasi boshqa (`runtimeVersion` mos kelmasa)

---

## 💰 Narxlar

### EAS Build:

- **Free tier:** 30 build/oy (Preview uchun yetarli)
- **Production Plan:** Ko'proq build kerak bo'lsa - $29/oy

### EAS Update:

- ✅ **Doim TEKIN** - cheksiz OTA yangilanish!

---

## 📱 Keyingi Qadamlar

### 1. Test Build:

```bash
eas build --platform android --profile preview
```

### 2. Birinchi OTA:

```bash
# Kichik o'zgarish qiling
eas update --branch production --message "Test yangilash"
```

### 3. Google Play'ga Joylash (ixtiyoriy):

```bash
# Production AAB yaratish
eas build --platform android --profile production

# Google Play Console'ga yuklash
# https://play.google.com/console
```

---

## ❓ Savol-Javoblar

**S: OTA qancha tez ishlaydi?**  
J: 1-5 daqiqa. Foydalanuvchilar ilovani yopib ochishi bilan yangilanadi.

**S: Har safar build qilish kerakmi?**  
J: Yo'q! JavaScript o'zgarishda faqat `eas update`. Native o'zgarishda build kerak.

**S: Xavfsizlik?**  
J: Expo code signing ishlatadi. Hech kim o'zgartirolmaydi.

**S: Internet kerakmi yangilanish uchun?**  
J: Ha, foydalanuvchi Wi-Fi/mobile data'da bo'lishi kerak.

---

## 🎉 Tayyor!

Endi siz:
- ✅ Production APK yarata olasiz
- ✅ OTA orqali havoda yangilaysiz
- ✅ Versiyalarni boshqarasiz

**Birinchi build'ni boshlang:**

```bash
eas build --platform android --profile preview
```

Natijani menga yuboring! 🚀
