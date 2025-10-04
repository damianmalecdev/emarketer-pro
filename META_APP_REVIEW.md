# Meta Ads API - App Review Guide

## 📋 Wymagane uprawnienia (Permissions)

Aby synchronizować dane z Meta Ads API, Twoja aplikacja musi uzyskać następujące uprawnienia przez **Facebook App Review**:

### Permissions do zgłoszenia:
1. **`ads_read`** - Odczyt danych kampanii reklamowych
2. **`ads_management`** - Zarządzanie kampaniami (opcjonalne)
3. **`business_management`** - Dostęp do Business Manager
4. **`pages_read_engagement`** - Odczyt statystyk stron Facebook (opcjonalne)

---

## 🚀 Kroki do uzyskania App Review

### 1. **Przejdź do Facebook App Dashboard**
   - Otwórz: https://developers.facebook.com/apps/
   - Wybierz swoją aplikację (App ID: sprawdź w `.env` → `META_APP_ID`)

### 2. **Dodaj uprawnienia do App Review**
   - W lewym menu kliknij **"App Review" → "Permissions and Features"**
   - Znajdź następujące uprawnienia i kliknij **"Request"**:
     - `ads_read`
     - `ads_management`
     - `business_management`

### 3. **Wypełnij formularz dla każdego uprawnienia**

#### Dla `ads_read`:
- **How will you use this permission?**
  > We will use ads_read to fetch campaign performance data (spend, impressions, clicks, conversions, ROAS) from user's Meta Ads accounts and display analytics, insights, and automated alerts in our marketing dashboard.

- **What data will you access?**
  > - Campaign names, IDs, and statuses
  > - Ad account information
  > - Performance metrics (spend, impressions, clicks, CTR, CPC, conversions)
  > - Campaign insights and statistics

- **Why do you need this permission?**
  > Our platform (eMarketer.pro) is a marketing analytics tool that helps users monitor their advertising performance across multiple platforms. We need ads_read to provide:
  > 1. Real-time campaign performance dashboards
  > 2. AI-powered insights and recommendations
  > 3. Automated anomaly detection and alerts
  > 4. Cross-platform campaign comparisons

#### Dla `business_management`:
- **How will you use this permission?**
  > We will use business_management to access user's ad accounts within their Business Manager to retrieve campaign data and insights.

#### Dla `ads_management` (opcjonalne):
- **How will you use this permission?**
  > We will use ads_management to help users optimize their campaigns by allowing them to pause/resume campaigns directly from our dashboard based on AI recommendations.

### 4. **Przygotuj materiały do weryfikacji**

Facebook wymaga **screencasta video** pokazującego Twoją aplikację. Nagraj 2-3 minutowe wideo pokazujące:

1. **Logowanie użytkownika** do eMarketer.pro
2. **Kliknięcie "Connect" przy Meta Ads** w Settings
3. **Proces OAuth** (przekierowanie do Facebooka, zaakceptowanie uprawnień)
4. **Dashboard z danymi** (kampanie, statystyki, wykresy)
5. **Funkcje AI** (chat z asystentem AI analizującym kampanie)
6. **Alerty** (pokazanie jak system wykrywa anomalie)

**Narzędzia do nagrywania:**
- macOS: QuickTime Player (Cmd+Shift+5)
- Windows: OBS Studio
- Online: Loom (https://loom.com)

**Wymagania video:**
- Format: MP4, MOV
- Maksymalny rozmiar: 100MB
- Rozdzielczość: minimum 720p
- Dźwięk: Dodaj narrację po angielsku opisującą co robisz

### 5. **Privacy Policy i Terms of Service**

Upewnij się, że masz:
- ✅ Privacy Policy: `https://emarketer.pro/privacy`
- ✅ Terms of Service: `https://emarketer.pro/terms`

Te strony muszą zawierać informacje o:
- Jakie dane zbierasz z Meta
- Jak przechowujesz dane
- Jak użytkownicy mogą usunąć swoje dane
- Kontakt do administratora

### 6. **App Details w Facebook Dashboard**

W **Settings → Basic**:
- ✅ **App Domains**: `emarketer.pro`
- ✅ **Privacy Policy URL**: `https://emarketer.pro/privacy`
- ✅ **Terms of Service URL**: `https://emarketer.pro/terms`
- ✅ **Category**: Business and Pages / Analytics
- ✅ **App Icon**: Logo 1024x1024px

### 7. **Prześlij do App Review**

- Po wypełnieniu wszystkich pól, kliknij **"Submit for Review"**
- Facebook zazwyczaj odpowiada w ciągu **5-7 dni roboczych**
- Możesz śledzić status w **App Review → Submission History**

---

## ⚠️ Częste powody odrzucenia

1. **Brak screencasta** lub źle pokazany use case
2. **Privacy Policy nie zawiera informacji o danych z Meta**
3. **Aplikacja nie działa** (nie ma HTTPS, błędy w OAuth)
4. **Niejasny use case** - nie wiadomo po co potrzebujesz danych

---

## 🧪 Tryb Development (Testing)

Przed App Review możesz testować z **Test Users**:

1. W Facebook App Dashboard → **Roles → Test Users**
2. Dodaj test usera lub użyj swojego konta jako **Developer**
3. **Developers i Test Users mają automatycznie wszystkie uprawnienia** bez App Review
4. Przetestuj pełną funkcjonalność przed zgłoszeniem do Review

---

## 📞 Wsparcie

Jeśli Facebook odrzuci Twoją aplikację:
- Przeczytaj powód odrzucenia w **App Review Dashboard**
- Popraw problemy
- **Wyślij ponownie** - możesz zgłaszać wielokrotnie

Dodatkowe info:
- Dokumentacja Meta: https://developers.facebook.com/docs/app-review
- Marketing API: https://developers.facebook.com/docs/marketing-apis
- Support: https://developers.facebook.com/support/bugs/

---

## ✅ Po zatwierdzeniu

Gdy Facebook zatwierdzi uprawnienia:
1. Twoi użytkownicy będą mogli **Connect** Meta Ads w eMarketer.pro
2. Przycisk **Sync** pobierze prawdziwe dane kampanii
3. Dashboard, AI Chat i Alerty będą działać z prawdziwymi danymi
4. Możesz reklamować integrację Meta na swojej stronie! 🎉

