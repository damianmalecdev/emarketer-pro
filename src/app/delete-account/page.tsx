export const metadata = {
  title: "Usunięcie danych i konta | eMarketer Pro",
  description:
    "Instrukcja usunięcia konta i danych użytkownika w eMarketer Pro zgodnie z RODO/DSR.",
};

export default function DeleteAccountPage() {
  return (
    <main className="container mx-auto px-6 py-24 my-16 max-w-3xl">
      <section className="prose prose-neutral dark:prose-invert">
        <h1>Usunięcie danych i konta (User Data Deletion)</h1>

        <p>
          Szanujemy Twoje prawo do prywatności. Poniżej znajdziesz informacje,
          jak usunąć konto oraz powiązane dane w eMarketer Pro.
        </p>

        <h2>Jak usunąć konto samodzielnie</h2>
        <ul>
          <li>Zaloguj się do Aplikacji.</li>
          <li>Przejdź do sekcji Ustawienia → Konto.</li>
          <li>Wybierz opcję „Usuń konto” i potwierdź decyzję.</li>
        </ul>
        <p>
          Usunięcie konta spowoduje trwałe usunięcie danych konta użytkownika i
          członkostw w firmach. Dane rozliczeniowe mogą być przechowywane przez
          okres wymagany przepisami prawa.
        </p>

        <h2>Żądanie usunięcia danych (DSR)</h2>
        <p>
          Jeśli nie możesz usunąć konta samodzielnie lub chcesz skorzystać z
          praw wynikających z RODO (dostęp, sprostowanie, usunięcie, ograniczenie
          przetwarzania, przenoszenie, sprzeciw), złóż wniosek przez dział
          „Kontakt/Support” w Aplikacji lub wyślij e‑mail na adres wsparcia
          podany w ustawieniach konta. W treści wskaż identyfikator konta/e‑mail
          logowania i zakres żądania.
        </p>

        <h2>Integracje zewnętrzne</h2>
        <p>
          Jeżeli połączyłeś konta reklamowe (np. Google Ads, Meta Ads, TikTok,
          GA4), po usunięciu konta w eMarketer Pro rekomendujemy także odpięcie
          dostępu w panelach tych dostawców (np. w ustawieniach bezpieczeństwa
          Google/Meta/TikTok), aby cofnąć tokeny OAuth.
        </p>

        <h2>Okresy przechowywania</h2>
        <p>
          Dane są usuwane lub anonimizowane niezwłocznie po realizacji żądania,
          z uwzględnieniem obowiązków prawnych (np. rachunkowość, bezpieczeństwo
          systemów). Zanonimizowane dane zbiorcze mogą być wykorzystywane do
          statystyk i rozwoju produktu.
        </p>

        <h2>Kontakt</h2>
        <p>
          W sprawach dotyczących usunięcia danych skorzystaj z sekcji
          „Kontakt/Support” w Aplikacji lub użyj adresu e‑mail widocznego w
          ustawieniach konta. Weryfikujemy tożsamość, aby chronić Twoje dane.
        </p>

        <p className="text-sm text-muted-foreground mt-8">
          Ostatnia aktualizacja: 29 października 2025 r.
        </p>
      </section>
    </main>
  );
}


