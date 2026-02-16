# App Loader - Ilova Yuklash Ekrani

## Tavsif

**AppLoader** komponenti - bu ilova yuklanayotganda foydalanuvchiga chiroyli va professional ko'rinishni ta'minlaydigan premium loader komponenti.

## Xususiyatlari

### 1. **Logotip bilan Animatsiya**
- Markazda katta logotip
- Pulsatsiya (pulse) effekti bilan jonli animatsiya
- Glow (porlash) effekti
- Soya va 3D effektlar

### 2. **Progress Bar (Yuklash Chizig'i)**
- 0% dan 100% gacha avtomatik to'ldiriladi
- 1.5 soniyada to'liq yuklanadi
- Chiroyli gradient ranglar (Coral Red)

### 3. **Nuqta Animatsiyalari**
- 3 ta nuqta ketma-ket animatsiya qiladi
- Har biri alohida opacity va scale effektlari bilan
- Loading jarayonining davomiyligini ko'rsatadi

### 4. **Background Effektlar**
- Orqa fonda katta abstrakt doiralar
- Blur effekti (faqat web da)
- Minimal va zamonaviy dizayn

### 5. **Dark Mode Qo'llab-quvvatlash**
- Light va Dark mode uchun moslashtirilgan
- Ranglar avtomatik o'zgaradi

### 6. **Responsive Design**
- Barcha ekran o'lchamlari uchun moslashtirilgan
- Mobile va Desktop da yaxshi ishlaydi

## Qo'llanilishi

```javascript
import AppLoader from './src/components/AppLoader';

// Ishlatish
<AppLoader isDarkMode={isDarkMode} />
```

## Texnik Ma'lumotlar

### Props:
- `isDarkMode` (boolean): Dark mode yoqilgan yoki yo'qligini belgilaydi

### Animatsiyalar:
1. **fadeAnim**: 0 dan 1 gacha fade in (800ms)
2. **scaleAnim**: 0.8 dan 1 gacha scale up (spring animation)
3. **progressAnim**: 0% dan 100% gacha progress bar (1500ms)
4. **pulseAnim**: Logo uchun pulsatsiya (davomiy loop)
5. **dot1Anim, dot2Anim, dot3Anim**: Nuqtalar uchun ketma-ket animatsiya

### Ranglar:
- **Light Mode**: 
  - Background: #FFFFFF
  - Accent: #FF6B6B
- **Dark Mode**:
  - Background: #0A0A0A
  - Accent: #FF4646

## Foydalanish vaqti

Loader quyidagi hollarda ko'rsatiladi:
1. Ilova birinchi marta yuklanayotganda
2. Autentifikatsiya tekshirilayotganda
3. Barcha context providerlar yuklanayotganda
4. AsyncStorage dan ma'lumotlar o'qilayotganda

## Vaqt davomiyligi

- Minimal vaqt: 1.5 soniya (progress bar)
- Maksimal vaqt: Barcha ma'lumotlar yuklanguncha

## Integratsiya

Loader `App.js` da `RootNavigator` komponenti ichida ishlatiladi:

```javascript
if (isLoading) {
    return <AppLoader isDarkMode={isDarkMode} />;
}
```

`isLoading` holati `AuthContext` dan keladi va quyidagi hollarda `true` bo'ladi:
- Ilova birinchi yuklanganda
- AsyncStorage dan user ma'lumotlari tekshirilayotganda

---

**Yaratilgan sana**: 2026-01-29
**Versiya**: 1.0.0
