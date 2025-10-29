export const metadata = {
  title: "Polityka prywatności | eMarketer Pro",
  description:
    "Polityka prywatności eMarketer Pro – informacje o przetwarzaniu danych osobowych, celach, podstawach prawnych, odbiorcach danych oraz prawach użytkowników.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto px-6 py-24 my-16 max-w-3xl">
      <section className="prose prose-neutral dark:prose-invert">
        <h1>Polityka prywatności</h1>
        <p>
          Niniejsza Polityka prywatności opisuje zasady przetwarzania danych
          osobowych w aplikacji eMarketer Pro ("Aplikacja"). Szanujemy Twoją
          prywatność i dbamy o bezpieczeństwo danych zgodnie z obowiązującymi
          przepisami, w szczególności RODO.
        </p>

        <h2>Administrator danych</h2>
        <p>
          Administratorem danych osobowych jest podmiot odpowiedzialny za
          Aplikację eMarketer Pro ("Administrator"). Dane kontaktowe do
          Administratora dostępne są w Aplikacji (sekcja Ustawienia / Kontakt).
        </p>

        <h2>Zakres przetwarzanych danych</h2>
        <ul>
          <li>Dane konta: imię i nazwisko, adres e‑mail, hasło (zahashowane).</li>
          <li>
            Dane organizacyjne: nazwa firmy, identyfikatory kont reklamowych,
            ustawienia integracji.
          </li>
          <li>
            Dane z integracji (np. Google Ads, Meta Ads): metryki kampanii,
            budżety, nazwy kampanii/adsetów/rek lam, dane rozliczeniowe
            powiązane z kontami reklamowymi.
          </li>
          <li>
            Dane techniczne: adres IP, identyfikatory urządzeń, logi
            bezpieczeństwa, pliki cookie i podobne technologie.
          </li>
        </ul>

        <h2>Cele i podstawy prawne przetwarzania</h2>
        <ul>
          <li>
            Świadczenie usług Aplikacji i realizacja umowy – art. 6 ust. 1 lit.
            b RODO.
          </li>
          <li>
            Obsługa integracji z zewnętrznymi platformami reklamowymi – art. 6
            ust. 1 lit. b i f RODO (prawnie uzasadniony interes polegający na
            zapewnieniu funkcjonalności Aplikacji).
          </li>
          <li>
            Utrzymanie i bezpieczeństwo Aplikacji, zapobieganie nadużyciom –
            art. 6 ust. 1 lit. f RODO.
          </li>
          <li>
            Rozliczenia, księgowość oraz wypełnienie obowiązków prawnych – art.
            6 ust. 1 lit. c RODO.
          </li>
          <li>
            Komunikacja i wsparcie użytkowników – art. 6 ust. 1 lit. b i f
            RODO.
          </li>
          <li>
            Analityka i rozwój produktu (w zakresie dozwolonym) – art. 6 ust. 1
            lit. f RODO.
          </li>
        </ul>

        <h2>Odbiorcy danych</h2>
        <p>
          Dane mogą być przekazywane dostawcom usług IT, hostingodawcom,
          podmiotom obsługującym analitykę, rozliczenia oraz dostawcom platform
          reklamowych, z którymi łączysz konto (np. Google, Meta). Zawsze
          przekazujemy wyłącznie dane niezbędne do danego celu i na podstawie
          odpowiednich umów powierzenia lub zasad określonych przez dostawców
          integracji.
        </p>

        <h2>Przekazywanie danych poza EOG</h2>
        <p>
          Jeżeli w związku z korzystaniem z usług dostawców (np. dostawców
          chmury) dane byłyby przekazywane poza EOG, odbywa się to zgodnie z
          wymogami RODO, w szczególności na podstawie standardowych klauzul
          umownych lub decyzji stwierdzających odpowiedni poziom ochrony.
        </p>

        <h2>Okres przechowywania</h2>
        <p>
          Dane przechowujemy przez okres niezbędny do świadczenia usług, a po
          zakończeniu świadczenia – przez czas wymagany przepisami prawa lub
          uzasadnioną obroną przed roszczeniami. Dane integracyjne mogą być
          cyklicznie agregowane i anonimizowane w celach statystycznych.
        </p>

        <h2>Prawa osób, których dane dotyczą</h2>
        <ul>
          <li>dostęp do danych, sprostowanie, usunięcie, ograniczenie;</li>
          <li>przenoszenie danych w zakresie przewidzianym przepisami;</li>
          <li>sprzeciw wobec przetwarzania opartego na art. 6 ust. 1 lit. f;</li>
          <li>
            wycofanie zgody (jeżeli przetwarzanie opiera się na zgodzie) bez
            wpływu na zgodność z prawem przetwarzania sprzed wycofania;
          </li>
          <li>wniesienie skargi do Prezesa UODO.</li>
        </ul>

        <h2>Pliki cookie i podobne technologie</h2>
        <p>
          Aplikacja może wykorzystywać niezbędne pliki cookie do zapewnienia
          działania oraz – za Twoją zgodą – analityczne/marketingowe. Szczegóły
          konfiguracji znajdują się w ustawieniach Aplikacji lub banerze cookie.
        </p>

        <h2>Zautomatyzowane podejmowanie decyzji</h2>
        <p>
          Nie podejmujemy wobec Ciebie decyzji w pełni zautomatyzowanych, które
          wywoływałyby wobec Ciebie skutki prawne lub w podobny sposób istotnie
          na Ciebie wpływały.
        </p>

        <h2>Bezpieczeństwo danych</h2>
        <p>
          Stosujemy odpowiednie środki techniczne i organizacyjne, aby chronić
          dane osobowe, w tym szyfrowanie danych w tranzycie, kontrolę dostępu
          oraz monitorowanie bezpieczeństwa.
        </p>

        <h2>Zmiany Polityki prywatności</h2>
        <p>
          Zastrzegamy sobie prawo do aktualizacji Polityki. O istotnych zmianach
          poinformujemy w Aplikacji. Aktualna wersja jest zawsze dostępna pod
          tym adresem.
        </p>

        <h2>Kontakt</h2>
        <p>
          W sprawach związanych z danymi osobowymi skontaktuj się poprzez
          sekcję „Kontakt/Support” w Aplikacji lub adres e‑mail wskazany w
          ustawieniach konta.
        </p>

        <p className="text-sm text-muted-foreground mt-8">
          Ostatnia aktualizacja: 29 października 2025 r.
        </p>
      </section>
    </main>
  );
}


