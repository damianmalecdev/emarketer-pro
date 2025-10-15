# 🔑 Dane Logowania do eMarketer.pro

## ✅ Baza Danych Skonfigurowana!

Baza danych SQLite została utworzona i zawiera demo użytkownika.

---

## 📧 Demo User - Dane do Logowania

```
Email:    demo@emarketer.pro
Hasło:    demo123456
```

---

## 🚀 Jak Się Zalogować

### Krok 1: Upewnij się że serwer działa

```bash
npm run dev
```

Aplikacja powinna uruchomić się na **http://localhost:3000**

### Krok 2: Otwórz przeglądarkę

Przejdź do: **http://localhost:3000/auth/signin**

### Krok 3: Zaloguj się

Wprowadź dane:
- **Email:** `demo@emarketer.pro`
- **Hasło:** `demo123456`

### Krok 4: Gotowe!

Po zalogowaniu zobaczysz:
- **Dashboard** z KPI cards
- **Settings** - możliwość podłączenia Google Ads/Meta
- **AI Chat** - asystent AI (wymaga OPENAI_API_KEY)
- **Nawigację** - po lewej stronie sidebar

---

## 📝 Jak Utworzyć Nowe Konto

Zamiast demo użytkownika, możesz utworzyć swoje konto:

1. Przejdź do **http://localhost:3000/auth/signup**
2. Wypełnij formularz:
   - Imię (opcjonalne)
   - Email
   - Hasło (min. 8 znaków)
3. Kliknij "Create Account"
4. Zostaniesz automatycznie zalogowany
5. System automatycznie utworzy firmę dla Ciebie

---

## 🗄️ Baza Danych

**Typ:** SQLite  
**Lokalizacja:** `prisma/dev.db`

**Tabele utworzone:**
- ✅ User (użytkownicy)
- ✅ Company (firmy)
- ✅ Membership (relacje user-company)
- ✅ Integration (połączenia z platformami)
- ✅ Campaign (kampanie marketingowe)
- ✅ CampaignMetric (metryki time-series)
- ✅ Event (wydarzenia GA4)
- ✅ Alert (powiadomienia)
- ✅ Report (raporty)
- ✅ ChatMessage (historia czatu z AI)
- ✅ Account, Session, VerificationToken (NextAuth)
- ✅ UserPreference, AnomalyDetection

---

## 🔍 Podgląd Bazy Danych

Możesz przeglądać bazę danych za pomocą Prisma Studio:

```bash
npx prisma studio
```

To otworzy GUI w przeglądarce na **http://localhost:5555**

---

## 🎯 Co Możesz Przetestować

### 1. Authentication ✅
- Logowanie demo użytkownikiem
- Rejestracja nowego konta
- Automatyczne tworzenie firmy

### 2. Dashboard ✅
- Widok główny z KPI
- Nawigacja sidebar
- Przełączanie między firmami (jeśli masz więcej)

### 3. Settings ✅
- Lista platform do podłączenia
- Przyciski Connect dla Google Ads i Meta
- Status połączeń

### 4. AI Chat ✅
- Interface czatu
- Historia konwersacji
- *Uwaga: Wymaga OPENAI_API_KEY w .env.local*

---

## ⚙️ Opcjonalne Konfiguracje

### Dodaj OpenAI API Key (dla AI Chat)

1. Zarejestruj się na https://platform.openai.com
2. Wygeneruj API key
3. Dodaj do `.env.local`:
   ```env
   OPENAI_API_KEY="sk-proj-twoj-klucz-tutaj"
   ```
4. Zrestartuj serwer

### Dodaj Google OAuth (dla logowania Google)

1. Przejdź do https://console.cloud.google.com
2. Utwórz OAuth credentials
3. Dodaj redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Dodaj do `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="twoj-client-id"
   GOOGLE_CLIENT_SECRET="twoj-client-secret"
   ```
5. Zrestartuj serwer

---

## 📊 Status Aplikacji

**Baza danych:** ✅ Skonfigurowana (SQLite)  
**Demo user:** ✅ Utworzony  
**Serwer dev:** 🚀 Uruchomiony na port 3000  
**Build:** ✅ Pomyślny  

---

## 🎉 Wszystko Gotowe!

Możesz teraz:
1. Otworzyć **http://localhost:3000** w przeglądarce
2. Zalogować się jako **demo@emarketer.pro** / **demo123456**
3. Eksplorować aplikację!

---

**Stworzono:** 2025-10-15  
**Aplikacja:** eMarketer.pro v1.0.0-beta

