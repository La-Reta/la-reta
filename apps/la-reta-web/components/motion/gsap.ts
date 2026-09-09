"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

/**
 * Punto de entrada único de GSAP.
 *
 * `registerPlugin` tiene que correr antes de la primera animación y basta con
 * hacerlo una vez. Si cada componente importara `gsap` por su cuenta, el que
 * olvidara registrar `useGSAP` se quedaría sin limpieza al desmontar y sin
 * ningún aviso: las animaciones sobreviven al componente y siguen escribiendo
 * en nodos que ya no están. Por eso GSAP se importa aquí y solo aquí.
 *
 * `useGSAP.headless` es `true`, así que registrarlo no toca `window` y el
 * módulo se puede evaluar durante el SSR del componente cliente que lo importa.
 * Un plugin nuevo (ScrollTrigger, Flip, SplitText) se registra en esta misma
 * línea — todos vienen ya en el paquete `gsap` desde la 3.13, no hay que
 * instalar nada, pero cada uno pesa en el bundle de quien importe este módulo.
 */
// eslint-disable-next-line unicorn/no-top-level-side-effects -- registrar al importar es justo lo que hace que nadie pueda olvidarlo
gsap.registerPlugin(useGSAP, CustomEase);

/**
 * La curva del sistema: la misma `cubic-bezier(0.22, 1, 0.36, 1)` que usan
 * `globals.css` y `EASE_OUT_EXPO` de `motion-tokens.ts`.
 *
 * CustomEase pesa ~2 kB y aun así compensa: ninguna curva de serie la clava
 * (`expo.out` frena mucho antes), y una animación de GSAP al lado de una
 * transición CSS con otro frenado se lee como un desajuste, no como estilo.
 */
export const EASE_RETA = CustomEase.create("reta", "0.22, 1, 0.36, 1");

/**
 * `--duration-move` (400 ms) y la curva de arriba como defaults de proyecto,
 * para que un `gsap.to()` sin `ease` ni `duration` ya salga con el ritmo de la
 * casa en vez de con los 0.5 s y el `power1.out` de fábrica.
 */
// eslint-disable-next-line unicorn/no-top-level-side-effects -- los defaults valen para todo el módulo GSAP, no para un componente
gsap.defaults({ duration: 0.4, ease: EASE_RETA });

/**
 * Condición para `gsap.matchMedia()`.
 *
 * GSAP no tiene un interruptor global equivalente al `reducedMotion="user"` de
 * Motion, así que aquí sí toca envolver cada animación. `matchMedia` revierte
 * sola lo que se creó dentro cuando la consulta deja de cumplirse:
 *
 *   useGSAP(() => {
 *     gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
 *       gsap.from(".item", { autoAlpha: 0, y: 12, stagger: 0.06 });
 *     });
 *   }, { scope: containerRef });
 */
export const NO_REDUCED_MOTION = "(prefers-reduced-motion: no-preference)";

export { useGSAP } from "@gsap/react";
export { gsap } from "gsap";
