# PostgreSQL - Szybka Konfiguracja

## 🚀 Opcja 1: Docker (Najszybsza - 2 minuty)

### Krok 1: Uruchom PostgreSQL w Docker

```bash
# W katalogu projektu uruchom:
docker compose -f docker-compose-postgres.yml up -d

# Poczekaj 5 sekund na uruchomienie
sleep 5
```

### Krok 2: Wdróż Schemat Bazy

```bash
# Wypchnij schemat do bazy
npx prisma db push

# Lub użyj migracji
npx prisma migrate dev --name init
```

### Krok 3: Uruchom Aplikację

```bash
npm run dev
```

### Krok 4: Otwórz w Przeglądarce

```
http://localhost:3000
```

---

## 🐘 Opcja 2: Lokalny PostgreSQL (Homebrew na Mac)

### Instalacja:

```bash
# Zainstaluj PostgreSQL
brew install postgresql@15

# Uruchom serwis
brew services start postgresql@15

# Utworz bazę danych
createdb emarketer_pro
```

### Konfiguracja:

W pliku `.env` i `.env.local`:

```bash
DATABASE_URL="postgresql://$(whoami)@localhost:5432/emarketer_pro"
```

Następnie:

```bash
npx prisma db push
npm run dev
```

---

## 🔧 Opcja 3: PostgreSQL z hasłem

Jeśli masz PostgreSQL z hasłem:

```bash
# W .env i .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/emarketer_pro"
```

Zamień `username` i `password` na swoje dane.

---

## 🆘 Rozwiązywanie Problemów

### Błąd: Port 5432 zajęty

```bash
# Sprawdź co używa portu
lsof -i :5432

# Zatrzymaj PostgreSQL
brew services stop postgresql@15
# Lub Docker:
docker stop emarketer-postgres
```

### Błąd: Authentication failed

```bash
# Sprawdź czy baza istnieje
psql -U postgres -l

# Utwórz bazę ręcznie
psql -U postgres -c "CREATE DATABASE emarketer_pro;"
```

### Sprawdź połączenie:

```bash
# Test połączenia
npx prisma db pull
```

---

## 📊 Po Skonfigurowaniu Bazy

1. **Wygeneruj Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Zasiej dane (opcjonalne):**
   ```bash
   npm run db:seed
   ```

3. **Otwórz Prisma Studio:**
   ```bash
   npm run db:studio
   ```

---

## ✅ Weryfikacja

Jeśli wszystko działa, powinieneś zobaczyć:

```
✓ Database connection established
✓ Next.js ready on http://localhost:3000
```

I możesz przejść do:
- **Dashboard**: http://localhost:3000/dashboard
- **Google Ads**: http://localhost:3000/dashboard/google-ads





