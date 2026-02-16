# App Store (iOS) Yuklash va O'rnatish Qo'llanmasi

Ilovangizni iPhone (iOS) telefonida ishlatish uchun ikki xil usul mavjud:
1. **Expo Go (Sinov uchun)** - Eng oson va bepul bo'lgan, rivojlantirish vaqti uchun.
2. **TestFlight / App Store (Reliz uchun)** - Haqiqiy ilova qilib o'rnatish ($99/yil Apple Developer hisobi kerak).

Siz Windows ishlatayotganingiz uchun **EAS Build** xizmatidan foydalanishimiz shart (chunki Windowsda Xcode yo'q).

---

## 1-usul: Expo Go orqali (Oson va Bepul)
Bu usulda ilova `.ipa` fayl bo'lib emas, balki Expo Go ichida ochiladi.
1. iPhone telefoningizga App Store'dan **Expo Go** ilovasini yuklang.
2. Kompyuterda terminalda `npx expo start` buyrug'ini bering.
3. QR kodni iPhone kamerasi bilan skanerlang.

---

## 2-usul: Haqiqiy Ilova (.ipa) yaratish
Bu usul uchun sizda **Apple Developer Account ($99/yil)** bo'lishi kerak.

### 1. Apple ID va Hisob
1. [developer.apple.com](https://developer.apple.com) saytiga kiring.
2. "Enroll" qilib, $99 to'lovni amalga oshiring.

### 2. EAS Build (Windowsdan turib)
Terminalda quyidagi buyruqni bering:

```powershell
eas build --platform ios
```

### 3. Savollarga javob berish
EAS sizdan Apple ID va parolingizni so'raydi (yoki App Store Connect API Key).
- **Apple ID login:** Apple ID va parolingizni kiriting.
- **Generate new certificate?** -> **Y** (Yes/Ha) deb javob bering.
- **Provisioning Profile?** -> **Y** (Yes/Ha) deb javob bering.

### 4. Build Turlari
Sizdan qaysi turdagi build kerakligini so'rashi mumkin (agar `eas.json` da sozlanmagan bo'lsa):
- **Development:** Simulyator yoki ro'yxatdan o'tgan telefonlar uchun (Debug).
- **Preview:** Faqat ichki test uchun (Ad-hoc).
- **Production:** App Store va TestFlight uchun.

Odatda **Production** tanlanadi.

### 5. Kutish va Yuklab olish
Build jarayoni Expo serverlarida 15-30 daqiqa davom etadi.
Tugagach, sizga **TestFlight** havolasi yoki `.ipa` fayl beriladi.

### 6. App Store Connect (TestFlight)
Eng qulay yo'li - bu **TestFlight**.
1. `eas submit -p ios` buyrug'i orqali buildni avtomatik Apple serveriga yuklang.
2. [App Store Connect](https://appstoreconnect.apple.com) ga kiring.
3. **TestFlight** bo'limida ilovangiz paydo bo'ladi.
4. Telefoningizga **TestFlight** ilovasini o'rnatib, u yerdan o'z ilovangizni yuklab oling.

---

## Muhim Eslatmalar (Windows Foydalanuvchilari uchun)
- Siz Windows ishlatayotganingiz uchun mahalliy kompyuteringizda (Local) build qila olmaysiz.
- Barcha jarayon EAS (Cloud) serverlarida bo'ladi.
- Agar Apple Developer hisobingiz bo'lmasa, siz **faqat Expo Go** (1-usul) orqali telefoningizda ko'ra olasiz.

## Xatoliklar chiqsa
Agar build paytida "Provisioning Profile" xatosi chiqsa, demak Apple Developer hisobingizda muammo bor yoki $99 to'lanmagan.
