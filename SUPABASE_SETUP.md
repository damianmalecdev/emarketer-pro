# 🚀 Supabase Setup - Szybka Konfiguracja

## 📋 Kroki do wykonania:

### 1. **Pobierz Connection String z Supabase**

1. Idź do [supabase.com](https://supabase.com) i zaloguj się
2. Wybierz swój projekt (lub utwórz nowy)
3. Przejdź do **Settings** → **Database**
4. Skopiuj **Connection string** (URI)

### 2. **Zaktualizuj plik .env**

Zamień w pliku `.env`:
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

Na swój prawdziwy connection string z Supabase.

### 3. **Przykład prawdziwego connection string:**

```bash
DATABASE_URL="postgresql://postgres:twoje_haslo@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

### 4. **Po skonfigurowaniu uruchom:**

```bash
# Wygeneruj Prisma Client
npx prisma generate

# Wdróż schemat do Supabase
npx prisma db push

# Uruchom aplikację
npm run dev
```

---

## 🔧 **Jeśli nie masz projektu Supabase:**

### Utwórz nowy projekt:
1. Idź na [supabase.com](https://supabase.com)
2. Kliknij **"New Project"**
3. Wybierz organizację
4. Podaj nazwę projektu: `emarketer-pro`
5. Wybierz region (np. `Europe West`)
6. Ustaw hasło bazy danych
7. Kliknij **"Create new project"**

### Po utworzeniu:
1. Przejdź do **Settings** → **Database**
2. Skopiuj connection string
3. Wklej do pliku `.env`

---

## ✅ **Weryfikacja:**

Po skonfigurowaniu powinieneś zobaczyć:
```
✓ Database connection established
✓ Next.js ready on http://localhost:3000
```

---

## 🆘 **Rozwiązywanie problemów:**

### Błąd: "Authentication failed"
- Sprawdź czy hasło w connection string jest poprawne
- Upewnij się że nie ma dodatkowych spacji

### Błąd: "Connection refused"
- Sprawdź czy project reference jest poprawny
- Upewnij się że projekt Supabase jest aktywny

### Błąd: "Database does not exist"
- Supabase automatycznie tworzy bazę `postgres`
- Nie musisz tworzyć bazy ręcznie

---

## 📞 **Potrzebujesz pomocy?**

Jeśli masz problemy z konfiguracją Supabase, podaj mi:
1. Czy masz już projekt Supabase?
2. Jaki błąd widzisz?
3. Czy możesz skopiować connection string (ukryj hasło)?

