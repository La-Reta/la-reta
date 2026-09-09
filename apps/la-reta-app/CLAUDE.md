# CLAUDE.md

@AGENTS.md

App nativa de La Reta. **Expo SDK 57 · expo-router (rutas tipadas) · React Native 0.86 · Reanimated 4 · react-native-svg · victory-native (Skia) · Clerk.**

No tiene base de datos ni lógica de servidor: todo sale de `/api/v1` de `apps/la-reta-web`. Lo que sí es suyo es cómo se ve y cómo se navega.

## Comandos

```bash
npm run dev                           # expo start --dev-client (el shell ya instalado)
npm run ios                           # compila e instala el shell en el simulador
npx expo lint                         # linter (este workspace no usa Ultracite)
npx tsc --noEmit -p tsconfig.json     # tipos
```

No hay runner de tests. Lo que se comprueba se comprueba en el simulador.

## Esto no corre en Expo Go

Corre en un **development build**: el mismo shell, recompilado con los módulos nativos de esta app dentro (Skia, `@expo/ui`, `expo-glass-effect`, el tab bar de iOS 26). Consecuencias que no se adivinan leyendo el código:

- **`npm run dev` no compila nada.** Solo levanta Metro. Si el shell instalado no existe todavía, o si cambió lo nativo, primero va `npm run ios`.
- **Recompilar solo cuando se mueve el shell**: instalar una librería con código nativo, tocar `app.json`, o subir de SDK. Un cambio de JavaScript llega por Fast Refresh como siempre.
- **Añadir una librería nativa son dos pasos, no uno.** `npx expo install <lib>` y después `npm run ios`. Sin lo segundo el bundle pide un módulo que el binario no tiene y revienta en runtime, no al compilar.
- **`ios/` y `android/` los genera `expo prebuild` y están fuera de git.** La configuración nativa se edita en `app.json` y en los config plugins; una edición a mano en `ios/` la borra el siguiente prebuild.
- **El `.env` no viaja a EAS.** Está en el `.gitignore`, así que una build en la nube no lo ve: los `EXPO_PUBLIC_*` de `preview` y `production` viven en las [environments de EAS](https://docs.expo.dev/eas/environment-variables/) que nombra cada perfil de `eas.json`. Ya están puestas y apuntan a la web desplegada (`https://la-reta-credix.vercel.app`), no a `localhost`: un APK lleva su bundle dentro y el teléfono de otro no alcanza tu máquina.
- **`expo-splash-screen` con solo `backgroundColor` rompe la build de Android.** El plugin escribe siempre `windowSplashScreenAnimatedIcon → @drawable/splashscreen_logo` en `styles.xml` (`withAndroidSplashStyles.js`), pero solo genera ese drawable si le pasas una imagen (`withAndroidSplashImages.js`), así que `processReleaseResources` muere con `resource drawable/splashscreen_logo not found`. En iOS no pasa. Por eso la imagen va dentro de `android: {}` y no arriba: arriba se la comería también iOS, que hoy no tiene ninguna a propósito —la bienvenida real la pinta `components/splash-overlay.tsx`—. Se reproduce en local mirando `android/app/src/main/res/`, no hace falta gastar una build para verlo.
- El script es `prebuild:clean`, no `prebuild`, porque npm ejecuta un `prebuild` solo antes de cualquier `build` y ese nombre acabaría borrando `ios/` sin que nadie lo pidiera.
- **`npm run ios` pide certificado de firma aunque el destino sea el simulador.** El plugin de Clerk mete `com.apple.developer.applesignin` en los entitlements, y ese permiso está en la lista corta de Expo que obliga a firmar también en simulador (`@expo/cli/.../codeSigning/simulatorCodeSigning.js`). En una Mac sin identidad de firma corta con `No code signing certificates are available to use.` antes de llamar a xcodebuild. Se arregla una vez añadiendo el Apple ID en Xcode → Settings → Accounts, gratis; el README de este workspace tiene también la vía por xcodebuild para saltárselo.

## Datos

- **`useApi(path)`** (`hooks/use-api.ts`) es la capa entera: fetch con `pending`/`loading`/`error` y un cache **a nivel de módulo** por ruta. Ese cache no es optimización: cada pantalla monta su propio hook, así que sin él abrir una ficha desde la rejilla empezaba de cero y la transición de zoom de iOS aterrizaba en una pantalla en blanco. Mientras revalida se sigue viendo lo último que se supo.
- **`useReta()`** junta roster y partidos, que es lo que casi toda pantalla necesita a la vez. Casi todo lo demás se **deriva en el cliente** de esas dos listas (`lib/players.ts`, `lib/summary.ts`, `lib/series.ts`, `lib/match-analysis.ts`, `lib/reta-stats.ts`): el acta guarda una fila por participante aunque no marque, así que de ahí salen convocatorias, rachas, compañeros y perfiles de equipo sin pedir nada más.
- Solo se pide aparte lo que esas dos listas no traen: `use-player-profile`, `use-match-votes`, `use-casacas`, `use-retas`.
- **`use-match-comments` no usa `useApi` a propósito.** El caché por ruta a nivel de módulo de `useApi` es justo lo que hace falta para el roster y justo lo que estorba aquí: una reseña recién escrita tiene que verse ya, y con ese caché la lista volvía a pintar lo de antes. Refrescar sube un contador que reejecuta el efecto; el `setState` síncrono dentro del efecto lo marca el linter de React y con razón.
- El token de Clerk lo inyecta `setSessionTokenProvider` en `lib/api.ts`. Sin `ClerkProvider` la app sigue funcionando contra lo público en vez de reventar.

## Navegación

Pestañas nativas (`expo-router/unstable-native-tabs`) en `app/(tabs)/`. Dos patrones que hay que respetar:

- **Grupos compartidos.** `(inicio,plantilla,partidos)/jugador/[id]` es una pantalla que vive en las tres pilas: tocar a alguien desde Partidos abre su ficha _dentro de Partidos_ y volver regresa de donde saliste. Si una pantalla se abre desde varias pestañas, va en el grupo; no se duplica el archivo.
- **Pantallas de la raíz** (`casacas`, `retas`, `editar-ficha`, `calendario`) para lo que se abre desde sitios distintos. Las dos primeras llevan cabecera propia (`DETAIL_SCREEN` en `app/_layout.tsx`) porque la pila raíz va con `headerShown: false`; las otras dos son `formSheet`.

- **La acción de una pantalla va en la cabecera, como `headerRight` del `Stack.Screen` de su `_layout.tsx`** (convocar, en _Armar reta_). Es un disco de 32 en verde macizo con el icono a 19 en `accentInk`, y los 44 pt de objetivo táctil los pone un `hitSlop`, no una caja mayor que descuadraría la barra. **Un trazo fino del color del sistema no vale ahí**: se lee como decoración y se pierde junto al título; el disco es lo único en ese borde y se ve antes de leer. Es la excepción a reservar el verde macizo para el banner de la próxima reta. Con dos, la principal va a la derecha del todo y la otra en `variant="plain"`: dos discos verdes juntos se pelean y ninguno manda. Si la acción depende del estado de la pantalla —convocatoria apaga «Repartir» sin gente y esconde «Compartir» sin reparto; plantilla esconde el suyo si ya tienes ficha— las opciones se declaran con un `<Stack.Screen options>` dentro de la propia pantalla, no en el `_layout`. Todo esto estuvo antes en el cristal de la barra de pestañas (`useTabAction`), que es el sitio que iOS 26 reserva para ello, pero una píldora del ancho de la pantalla se comía la mitad baja del contenido para decir lo que la cabecera dice con un dibujo. **`tab-action.tsx` y el `BottomAccessory` de `app-tabs.tsx` siguen ahí y ya no los usa nadie**; se dejan por si vuelve a hacer falta un accesorio, no porque estén en uso.

Ojo con las hojas: dentro de un `formSheet`, un `KeyboardAvoidingView` se queda sin alto y deja la hoja en blanco. Y Fast Refresh no vuelve a aplicar las opciones de `Stack.Screen`: si tocas una —el `headerRight` incluido—, recarga la app entera antes de creerte lo que ves.

## Cómo se ve

Los tokens están en `constants/theme.ts` y son la traducción exacta de los de la web, no una aproximación. Dos decisiones sostienen el resto: **papel hueso** detrás de tarjetas blancas, y **un solo acento** verde. El ámbar de las estrellas y las casacas es la única excepción, y está anotada donde se define.

Piezas, todas en `components/ui/`: `Text` (con `variant`, nunca `fontSize` a mano), `Surface`, `Section`, `Button`, `Field`, `Icon` (línea, 24 de retícula) y `ColorIcon` (a color, solo donde se elige un destino).

- **Coronar a alguien en portada es `SpotlightCard`** (`components/spotlight-card.tsx`): retrato, nombre y una sola cifra grande, con un `footer` para lo que cambie. La usan _El crack_ (sus seis atributos) y _El goleador_ (partidos y puntos del carrusel), y ese es el motivo de que exista: cuando eran dos tarjetas sueltas, tocar una dejaba a la otra un poco distinta y el par se leía como casual en vez de comparable.
- Las cifras van en Oswald con `tabular-nums`. Interlineado mínimo 1.2 em o se come la tilde de la Ñ.
- **Nada de encajonar cada elemento de una lista.** La caja se gana cuando marca una zona pulsable —la rejilla de goleadores— no por decorar.
- Las gráficas son victory-native sobre Skia. Skia no ve las fuentes de `expo-font`: los ejes usan `useChartFont`, y cualquier cifra dentro de una gráfica va en `<Text>` de React Native superpuesto.
- **Una barra vale lo que mide**: toda gráfica de barras fija `domain={{ y: [0, máximo] }}`. Con el suelo pegado al mínimo, la barra más baja desaparece y el resto miente sobre su proporción.

## Lo que aporta ser nativo

Se usa donde cambia la experiencia, no para lucirlo: háptica en la ruleta de casacas (un tic por gajo, contado sobre el ángulo y no con un temporizador, porque la rueda frena), la transición de zoom de iOS al abrir una ficha, gestos de deslizar en la lista de invitados, `formSheet` nativas y la barra de pestañas de iOS 26 con su accesorio de cristal.
