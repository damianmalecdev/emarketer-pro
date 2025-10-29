export const metadata = {
  title: "Regulamin (Terms of Service) | eMarketer Pro",
  description:
    "Regulamin korzystania z aplikacji eMarketer Pro – zasady świadczenia usług, odpowiedzialność, płatności i rozwiązanie umowy.",
};

export default function TermsOfServicePage() {
  return (
    <main className="container mx-auto px-6 py-24 my-16 max-w-3xl">
      <section className="prose prose-neutral dark:prose-invert">
        <h1>Regulamin korzystania z eMarketer Pro (Terms of Service)</h1>

        <p>
          Niniejszy Regulamin określa warunki korzystania z aplikacji eMarketer
          Pro ("Aplikacja"). Korzystając z Aplikacji, akceptujesz postanowienia
          Regulaminu.
        </p>

        <h2>Definicje</h2>
        <ul>
          <li>
            <strong>Usługa</strong> – funkcjonalności Aplikacji umożliwiające
            integrację i analizę danych marketingowych.
          </li>
          <li>
            <strong>Użytkownik</strong> – osoba korzystająca z Aplikacji, w tym
            działająca w imieniu firmy.
          </li>
          <li>
            <strong>Firma/Klient</strong> – podmiot, na rzecz którego
            świadczone są Usługi.
          </li>
        </ul>

        <h2>Zakres i warunki świadczenia Usług</h2>
        <ul>
          <li>
            Dostęp do Aplikacji wymaga utworzenia konta i akceptacji
            Regulaminu.
          </li>
          <li>
            Integracje (np. Google Ads, Meta Ads, TikTok, GA4) wymagają
            połączenia kont przez oficjalne mechanizmy OAuth/API.
          </li>
          <li>
            Możliwe są zmiany funkcjonalności i planów taryfowych z należytą
            informacją z wyprzedzeniem.
          </li>
        </ul>

        <h2>Płatności</h2>
        <p>
          Jeżeli korzystasz z planu płatnego, opłaty są pobierane zgodnie z
          cennikiem i warunkami przedstawionymi w Aplikacji. Brak płatności może
          skutkować ograniczeniem lub zawieszeniem dostępu do Usługi.
        </p>

        <h2>Odpowiedzialność</h2>
        <ul>
          <li>
            Dokładamy starań, aby zapewnić ciągłość i bezpieczeństwo Usługi,
            jednak w granicach prawa wyłączamy odpowiedzialność za straty
            powstałe wskutek przerw technicznych, zmian u dostawców API lub
            zdarzeń niezależnych.
          </li>
          <li>
            Użytkownik odpowiada za legalność i poprawność danych wprowadzanych
            do Aplikacji oraz za utrzymanie poufności danych logowania.
          </li>
        </ul>

        <h2>Własność intelektualna</h2>
        <p>
          Aplikacja oraz jej elementy są chronione prawem. Zabronione jest
          kopiowanie, modyfikacja lub dystrybucja bez zgody, z wyjątkiem zakresu
          dozwolonego przez prawo.
        </p>

        <h2>Okres obowiązywania i rozwiązanie</h2>
        <ul>
          <li>
            Umowa obowiązuje od momentu utworzenia konta i akceptacji
            Regulaminu.
          </li>
          <li>
            Użytkownik może rozwiązać umowę w każdym czasie, usuwając konto lub
            rezygnując z planu.
          </li>
          <li>
            W przypadku naruszenia Regulaminu dostęp do Usługi może zostać
            ograniczony lub zakończony.
          </li>
        </ul>

        <h2>Zmiany Regulaminu</h2>
        <p>
          Zastrzegamy sobie prawo do aktualizacji Regulaminu. O istotnych
          zmianach poinformujemy w Aplikacji. Aktualna wersja jest zawsze
          dostępna pod tym adresem.
        </p>

        <h2>Kontakt</h2>
        <p>
          W sprawach dotyczących Regulaminu skontaktuj się poprzez sekcję
          „Kontakt/Support” w Aplikacji lub adres e‑mail wskazany w ustawieniach
          konta.
        </p>

        <p className="text-sm text-muted-foreground mt-8">
          Ostatnia aktualizacja: 29 października 2025 r.
        </p>
      </section>
    </main>
  );
}


