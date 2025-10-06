# 🚀 Deployment eMarketer.pro - Instrukcja krok po kroku

## Połączenie z serwerem

```bash
ssh ubuntu@malec.in
# Hasło: Juhas24PL!
```

---

## KROK 1: Uruchom PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

---

## KROK 2: Utwórz użytkownika bazy danych

```bash
sudo -u postgres psql
```

W PostgreSQL wykonaj:

```sql
DROP USER IF EXISTS emarketer_user;
CREATE USER emarketer_user WITH PASSWORD 'ILAHSdiudhbaisuąęźć3124asnfi';
GRANT ALL PRIVILEGES ON DATABASE emarketer TO emarketer_user;
ALTER USER emarketer_user CREATEDB;
\q
```

---

## KROK 3: Sprawdź czy użytkownik został utworzony

```bash
sudo -u postgres psql -c "\du"
```

---

## KROK 4: Przejdź do katalogu projektu

```bash
cd /www/wwwroot/emarketer-pro
```

---

## KROK 5: Utwórz plik .env

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://emarketer_user:ILAHSdiudhbaisuąęźć3124asnfi@localhost:5432/emarketer"
NEXTAUTH_URL="https://emarketer.pro"
NEXTAUTH_SECRET="super-sekretny-klucz-min-32-znaki-1234567890abcdef"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
META_APP_ID="1919692722287345"
META_APP_SECRET="6b5bfae07d7ebf4af24f01092100d77e"
OPENAI_API_KEY="your-openai-api-key"
PORT=3005
EOF
```

---

## KROK 6: Skopiuj do .env.local

```bash
cp .env .env.local
cat .env
```

---

## KROK 7: Uruchom migracje bazy danych

```bash
npx prisma generate
npx prisma db push
```

---

## KROK 8: Zasiej dane testowe

```bash
ai
```

---

## KROK 9: Utwórz konfigurację PM2

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'emarketer-pro',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/emarketer-pro',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    }
  }]
}
EOF
```

---

## KROK 10: Zatrzymaj starą instancję PM2

```bash
pm2 stop all
pm2 delete all
```

---

## KROK 11: Uruchom aplikację

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## KROK 12: Sprawdź status

```bash
pm2 status
pm2 logs emarketer-pro --lines 50
```

---

## KROK 13: Sprawdź czy aplikacja działa

```bash
curl http://localhost:3005
```

---

## ✅ WERYFIKACJA

Aplikacja powinna być dostępna pod adresem:
- **Lokalnie**: http://localhost:3005
- **Przez domenę**: https://emarketer.pro (po skonfigurowaniu DNS i SSL)

### Dane testowe:
- **Email**: demo@emarketer.pro
- **Hasło**: demo123

---

## 🔧 PRZYDATNE KOMENDY

### Restart aplikacji
```bash
pm2 restart emarketer-pro
```

### Sprawdź logi
```bash
pm2 logs emarketer-pro --lines 100
```

### Monitorowanie
```bash
pm2 monit
```

### Aktualizacja kodu
```bash
cd /www/wwwroot/emarketer-pro
git pull
npm install
npx prisma db push
pm2 restart emarketer-pro
```

---

## 🌐 KONFIGURACJA DNS

W panelu domeny ustaw:
```
A    emarketer.pro         → IP_VPS
A    www.emarketer.pro     → IP_VPS
```

---

## 🔒 KONFIGURACJA SSL W aaPanel

1. Website → emarketer.pro → SSL
2. Let's Encrypt → Apply
3. Force HTTPS → Enable

---

## 🎯 GOTOWE!

Po wykonaniu wszystkich kroków aplikacja będzie dostępna pod adresem:
**https://emarketer.pro**

