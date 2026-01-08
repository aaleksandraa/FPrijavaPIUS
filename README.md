# PIUS Academy - Frontend (React)

React aplikacija za registraciju studenata i upravljanje ugovorima.

## Instalacija

```bash
npm install
```

## Pokretanje

```bash
npm run dev
# http://localhost:5173
```

## Build

```bash
npm run build
# Generiše dist/ folder
```

## Struktura

```
src/
├── components/             # React komponente
├── pages/                  # Stranice
│   ├── RegistrationPage.tsx
│   ├── ContractPage.tsx
│   ├── admin/              # Admin stranice
│   └── ...
├── lib/
│   ├── api.ts              # API klijent
│   └── pdfGenerator.ts     # PDF generisanje
├── types/                  # TypeScript tipovi
└── App.tsx

public/                     # Statički fajlovi
```

## Stranice

### Javne
- **LandingPage** - Početna stranica
- **RegistrationPage** - Registracija (4 koraka)
- **ContractPage** - Potpisivanje ugovora
- **ThankYouPage** - Zahvala

### Admin
- **AdminLogin** - Prijava
- **AdminDashboard** - Pregled
- **AdminStudents** - Upravljanje studentima
- **AdminContracts** - Upravljanje ugovorima
- **AdminInvoices** - Upravljanje fakturama
- **AdminTemplates** - Upravljanje template-ima

## Konfiguracija

Uredite `.env` fajl:

```env
VITE_API_URL=http://localhost:8000
```

Za produkciju:

```env
VITE_API_URL=https://your-domain.com
```

## Tehnologije

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- React Hook Form
- Yup (validacija)
- jsPDF (PDF generisanje)

## Testiranje

```bash
npm run test
```

## Podrška

Za pitanja, kontaktirajte: info@pius-academy.com
