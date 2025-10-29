# 🔑 Supabase API Keys - Gdzie je znaleźć

## 📍 **Lokalizacja kluczy w Supabase Dashboard:**

### 1. **Przejdź do swojego projektu Supabase**
- [supabase.com](https://supabase.com) → Twój projekt

### 2. **Settings → API**
Znajdziesz tam:

#### **Project URL:**
```
https://[YOUR-PROJECT-REF].supabase.co
```
→ Wklej do `NEXT_PUBLIC_SUPABASE_URL`

#### **anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Wklej do `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### **service_role secret key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Wklej do `SUPABASE_SERVICE_ROLE_KEY`

### 3. **Settings → Database**
Znajdziesz tam:

#### **Connection string:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
→ Wklej do `DATABASE_URL` (zamień `[YOUR-PASSWORD]` na prawdziwe hasło)

---

## 📝 **Przykład wypełnionego .env:**

```bash
# SUPABASE DATABASE
DATABASE_URL="postgresql://postgres:moje_haslo123@db.abcdefghijklmnop.supabase.co:5432/postgres"

# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE5NTAxNDM4OTB9.example"
```

---

## ⚠️ **Ważne:**

- **anon key** - bezpieczny dla frontendu (publiczny)
- **service_role key** - tylko dla backendu (prywatny)
- **Database password** - ustawiłeś podczas tworzenia projektu

---

## 🚀 **Po skonfigurowaniu:**

```bash
# Wygeneruj Prisma Client
npx prisma generate

# Wdróż schemat do Supabase
npx prisma db push

# Uruchom aplikację
npm run dev
```

---

## 🆘 **Jeśli nie masz projektu Supabase:**

1. Idź na [supabase.com](https://supabase.com)
2. Kliknij **"New Project"**
3. Wybierz organizację
4. Nazwa: `emarketer-pro`
5. Region: `Europe West` (lub najbliższy)
6. **Ustaw hasło bazy danych** (zapisz je!)
7. Kliknij **"Create new project"**

Po utworzeniu przejdź do **Settings → API** i **Settings → Database**.
