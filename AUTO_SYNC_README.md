# 🔄 Automatyczna synchronizacja danych - Dokumentacja

## Przegląd

Aplikacja eMarketer.pro automatycznie synchronizuje dane z Meta Ads i Google Ads **co 30 minut**.

---

## Jak to działa?

### 1. **Cron Job (node-cron)**
- Uruchamia się przy starcie aplikacji (`instrumentation.ts`)
- Wykonuje synchronizację co 30 minut
- Format cron: `*/30 * * * *`

### 2. **Endpoint synchronizacji**
- `POST /api/cron/sync-all`
- Wymaga autoryzacji: `Authorization: Bearer {CRON_SECRET}`
- Synchronizuje wszystkie aktywne integracje

### 3. **Co jest synchronizowane?**
- ✅ Wszystkie kampanie Meta Ads (ostatnie 30 dni)
- ✅ Wszystkie kampanie Google Ads (ostatnie 30 dni)
- ✅ Metryki: spend, impressions, clicks, conversions, revenue, CTR, CPC, ROAS

---

## Komendy wdrożenia na VPS

```bash
ssh ubuntu@malec.in
cd /www/wwwroot/emarketer-pro

# 1. Pull najnowszego kodu
git pull origin main

# 2. Dodaj CRON_SECRET do .env
nano .env
# Dodaj linię:
# CRON_SECRET="jakis-bardzo-bezpieczny-klucz-123456"

# 3. Zainstaluj zależności (jeśli potrzeba)
npm install

# 4. Zaktualizuj bazę danych
npx prisma db push --accept-data-loss
npx prisma generate

# 5. Zbuduj aplikację
npm run build

# 6. Restart PM2
pm2 restart emarketer-pro --update-env

# 7. Sprawdź logi
pm2 logs emarketer-pro
```

---

## Sprawdzanie czy działa

### 1. Sprawdź logi PM2
```bash
pm2 logs emarketer-pro --lines 50
```

Powinieneś zobaczyć:
```
🚀 Initializing cron jobs...
✅ Cron jobs initialized - Auto-sync every 30 minutes
```

### 2. Po 30 minutach sprawdź logi synchronizacji
```
⏰ Running scheduled sync at: 2025-10-05T12:00:00.000Z
🔄 Starting automatic sync for all users...
📊 Found X active integrations
🔄 Syncing meta for user user@example.com...
✅ Successfully synced meta for user@example.com
✅ Sync completed: X success, 0 failed
```

### 3. Manualne wywołanie synchronizacji (do testowania)
```bash
curl -X POST https://emarketer.pro/api/cron/sync-all \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

---

## Zmienne środowiskowe

Dodaj do `.env`:

```env
# Cron Jobs
CRON_SECRET="jakis-bardzo-bezpieczny-klucz-123456"
```

⚠️ **WAŻNE**: Użyj bezpiecznego, losowego klucza w produkcji!

---

## Harmonogram synchronizacji

| Czas | Akcja |
|------|-------|
| 00:00 | Sync |
| 00:30 | Sync |
| 01:00 | Sync |
| 01:30 | Sync |
| ... | ... |
| 23:30 | Sync |

**48 synchronizacji dziennie** (co 30 minut)

---

## Monitoring

### Logi aplikacji
```bash
pm2 logs emarketer-pro
```

### Logi błędów
```bash
pm2 logs emarketer-pro --err
```

### Status PM2
```bash
pm2 status
```

---

## Rozwiązywanie problemów

### Problem: Cron job nie startuje
**Rozwiązanie:**
1. Sprawdź czy `instrumentation.ts` jest w `src/`
2. Sprawdź `next.config.ts` - czy ma `experimental.instrumentationHook: true`
3. Restart aplikacji: `pm2 restart emarketer-pro`

### Problem: Sync się nie wykonuje
**Rozwiązanie:**
1. Sprawdź logi: `pm2 logs emarketer-pro`
2. Sprawdź czy `CRON_SECRET` jest w `.env`
3. Sprawdź czy `NEXTAUTH_URL` jest ustawiony poprawnie

### Problem: Sync się wykonuje ale failuje
**Rozwiązanie:**
1. Sprawdź szczegółowe logi błędów
2. Sprawdź czy tokeny API są ważne (Meta, Google Ads)
3. Sprawdź czy użytkownicy mają aktywne integracje

---

## Wyłączanie automatycznej synchronizacji

Jeśli chcesz **wyłączyć** automatyczną synchronizację:

1. **Komentarz w kodzie** (`src/instrumentation.ts`):
```typescript
// cron.schedule('*/30 * * * *', async () => {
//   // ... sync code
// })
```

2. **Rebuild i restart**:
```bash
npm run build
pm2 restart emarketer-pro
```

---

## Ręczna synchronizacja

Użytkownicy mogą ręcznie zsynchronizować dane:
1. Przejdź do **Settings**
2. Kliknij **"Sync Data"** przy Meta Ads lub Google Ads
3. Poczekaj na potwierdzenie

---

## Bezpieczeństwo

- ✅ Endpoint chroniony `CRON_SECRET`
- ✅ Tylko dla platform z aktywnymi integracjami
- ✅ Automatyczne odświeżanie tokenów OAuth
- ✅ Logging wszystkich operacji

---

## Performance

- ⚡ Synchronizacja nie blokuje aplikacji (async)
- ⚡ Każda integracja synchronizuje się niezależnie
- ⚡ Rate limiting przez API Meta/Google
- ⚡ Timeout handling

---

## FAQ

**Q: Czy mogę zmienić częstotliwość na co 15 minut?**
A: Tak, zmień `*/30 * * * *` na `*/15 * * * *` w `src/instrumentation.ts`

**Q: Czy synchronizacja zużywa dużo zasobów?**
A: Nie, synchronizacja działa asynchronicznie i nie wpływa na wydajność aplikacji

**Q: Czy mogę ręcznie wywołać sync dla konkretnego użytkownika?**
A: Tak, użytkownik może kliknąć "Sync Data" w Settings

**Q: Co się stanie jeśli sync failuje?**
A: Błąd zostanie zalogowany, ale następna próba nastąpi za 30 minut

---

## Kontakt

W razie problemów:
- Sprawdź logi: `pm2 logs emarketer-pro`
- Sprawdź status: `pm2 status`
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione

