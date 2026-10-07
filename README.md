# Gym Legends

Juego de gimnasio en 3D (React + three.js) con la Profe Maribel. En español e inglés.

## Desarrollo

```bash
npm install
npm run dev
```

Para probar en inglés agrega `?hl=en` a la URL (o cambia el idioma en Ajustes).

Comprobaciones antes de publicar:

```bash
npm run lint
npm run build
```

## Dónde se publica

El mismo código sale en tres versiones. La plataforma de anuncios se elige con `VITE_AD_PROVIDER` en el archivo `.env.<modo>`.

| Versión | Comando | Carpeta | Anuncios |
| --- | --- | --- | --- |
| CrazyGames | `npm run build:crazygames` | `dist-crazygames/` | SDK de CrazyGames |
| GameDistribution | `npm run build:gd` | `dist-gamedistribution/` | SDK de GameDistribution |
| Web propia (Vercel) | `npm run build` | `dist/` | Google H5 Games Ads (AdSense) |

### CrazyGames

1. `npm run build:crazygames`
2. Comprime el **contenido** de `dist-crazygames/` en un zip (el `index.html` debe quedar en la raíz del zip).
3. Súbelo en el [portal de desarrolladores de CrazyGames](https://developer.crazygames.com/) con las portadas de `marketing/`.

En los portales no se envían analíticas ni se registra el service worker. El idioma se toma del SDK de CrazyGames.

### GameDistribution

1. Crea el juego en el [panel de GameDistribution](https://developer.gamedistribution.com/) y copia su **Game ID**.
2. Pégalo en `.env.gamedistribution`: `VITE_GD_GAME_ID=...` (sin él, los anuncios quedan apagados).
3. `npm run build:gd` y sube el zip del contenido de `dist-gamedistribution/`.

### Web propia en Vercel

Es la versión a la que apuntan los retos de WhatsApp. Las funciones de `api/` generan la vista previa de cada reto:

- `/r?reto=...` (reescrito a `api/reto.ts`) devuelve las etiquetas Open Graph y redirige al juego.
- `api/og.ts` dibuja la imagen 1200×630 del reto.

Variables de entorno en Vercel (Project → Settings → Environment Variables):

| Variable | Valor |
| --- | --- |
| `VITE_AD_PROVIDER` | `google` |
| `VITE_ADSENSE_CLIENT` | `ca-pub-XXXXXXXXXXXXXXXX` (tu cuenta de AdSense con H5 Games Ads aprobado) |
| `VITE_SHARE_URL` | URL pública del sitio, ej. `https://gym-legends.vercel.app/` |
| `VITE_POSTHOG_KEY` | API key del proyecto en [PostHog](https://posthog.com/) (opcional, para medir retención y viralidad) |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` o `https://eu.i.posthog.com` |
| `VITE_PLAY_URL` | Déjala **vacía**. Si tiene valor, la web solo muestra el juego del portal dentro de un iframe. |

Para AdSense crea también `public/ads.txt` con tu línea de editor:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Después de cambiar variables, vuelve a desplegar (`vercel --prod` o un push a la rama conectada).

La web propia se puede instalar como app (PWA): `public/manifest.webmanifest` y `public/sw.js`. El botón "Instalar la app" aparece en el gimnasio cuando el navegador lo permite.

## Eventos de analítica

Con `VITE_POSTHOG_KEY` configurada, la web propia envía: `first_open`, `session_start`, `training_start`, `training_finish`, `level_up`, `ad_rewarded`, `ad_midgame`, `share`, `challenge_open`, `challenge_accept`, `challenge_won`, `rematch_open`, `daily_claim`, `streak_saved`, `school_open`, `pwa_install`.

Métricas para vigilar: retención día 1 y día 7 (`session_start`), retos abiertos por cada reto compartido (`challenge_open` / `share`) y anuncios con premio por sesión (`ad_rewarded`).

## Material de marketing

`marketing/` tiene las portadas que piden los portales (1920×1080, 800×1200, 800×800) y el ícono de 512 px.
