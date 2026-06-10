This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Privacy en delen

- `/medisch` is een privépagina en vereist dezelfde NextAuth-login als de privé API-routes. De persoonlijke medische gegevens staan niet in de codebase maar in de privé Supabase Storage-bucket `private-content` (invullen/bewerken via `/medisch?bewerk=1`).
- `/voor-thuis` is afgeschermd met een gedeeld wachtwoord voor familie en vrienden (standaard in te stellen via de env-variabele `VOORTHUIS_PASSWORD`). Wijzig je het wachtwoord, dan vervallen alle eerder uitgedeelde toegangscookies vanzelf.
- Deel een eventuele geheime of moeilijk te raden URL nooit publiek, niet in openbare chats en niet op sociale media. Een geheime URL is geen vervanging voor inloggen.
- Gebruik `/nood` als openbare noodmodus: die pagina bevat alleen minimale Franse noodnummers en geen medische context of persoonsgegevens.
- De service worker cachet geen privépagina's of API-antwoorden, zodat medische gegevens en thuisblijversupdates niet onbedoeld offline in een publieke browsercache blijven staan.
