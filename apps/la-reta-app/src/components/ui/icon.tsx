import Svg, { Circle, Path } from "react-native-svg";

import { Palette } from "@/constants/theme";

/**
 * Iconos propios, dibujados sobre una retícula de 24 con trazo de 1.8 y remates
 * redondos.
 *
 * Son de línea y no rellenos para que convivan con una tipografía de peso medio
 * sin pesar más que ella. Se dibujan aquí en vez de tirar de SF Symbols porque
 * la app también corre en Android y en web, donde ese catálogo no existe, y una
 * librería de iconos entera pesaría más que estas nueve rutas.
 */

export type IconName =
  | "ball"
  | "jersey"
  | "trophy"
  | "calendar"
  | "chevron"
  | "arrow"
  | "shield"
  | "spark"
  | "pulse"
  | "person"
  | "people"
  | "star"
  | "flame"
  | "close";

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Grosor del trazo; súbelo si el icono va junto a texto en negrita. */
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  color = Palette.ink,
  strokeWidth = 1.8,
}: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {name === "ball" ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          {/* El pentágono central y sus cinco radios: el balón clásico. */}
          <Path
            d="M12 7.8 L15.99 10.7 L14.47 15.4 L9.53 15.4 L8.01 10.7 Z"
            {...stroke}
          />
          <Path d="M12 7.8 V3" {...stroke} />
          <Path d="M15.99 10.7 L20.56 9.22" {...stroke} />
          <Path d="M14.47 15.4 L17.29 19.28" {...stroke} />
          <Path d="M9.53 15.4 L6.71 19.28" {...stroke} />
          <Path d="M8.01 10.7 L3.44 9.22" {...stroke} />
        </>
      ) : null}

      {name === "jersey" ? (
        <Path
          d="M9 3 L6 4 L3 7 L5.5 10 L6.6 9.4 L6.6 21 L17.4 21 L17.4 9.4 L18.5 10 L21 7 L18 4 L15 3 A3 3 0 0 1 9 3 Z"
          {...stroke}
        />
      ) : null}

      {name === "trophy" ? (
        <>
          <Path d="M8 4 H16 V9 A4 4 0 0 1 8 9 Z" {...stroke} />
          <Path d="M8 5 H5.5 A2.5 2.5 0 0 0 8.4 9.2" {...stroke} />
          <Path d="M16 5 H18.5 A2.5 2.5 0 0 1 15.6 9.2" {...stroke} />
          <Path d="M12 13 V16.5" {...stroke} />
          <Path d="M9.5 20.5 H14.5" {...stroke} />
          <Path d="M10 16.5 H14 V20.5" {...stroke} />
        </>
      ) : null}

      {name === "calendar" ? (
        <>
          <Path
            d="M4.5 5.5 H19.5 A1.5 1.5 0 0 1 21 7 V19.5 A1.5 1.5 0 0 1 19.5 21 H4.5 A1.5 1.5 0 0 1 3 19.5 V7 A1.5 1.5 0 0 1 4.5 5.5 Z"
            {...stroke}
          />
          <Path d="M8 3 V8" {...stroke} />
          <Path d="M16 3 V8" {...stroke} />
          <Path d="M3 11 H21" {...stroke} />
        </>
      ) : null}

      {name === "chevron" ? (
        <Path d="M9.5 5 L16.5 12 L9.5 19" {...stroke} />
      ) : null}

      {name === "close" ? (
        <>
          <Path d="M6.5 6.5 L17.5 17.5" {...stroke} />
          <Path d="M17.5 6.5 L6.5 17.5" {...stroke} />
        </>
      ) : null}

      {name === "arrow" ? (
        <>
          <Path d="M4 12 H19" {...stroke} />
          <Path d="M13 6 L19 12 L13 18" {...stroke} />
        </>
      ) : null}

      {name === "shield" ? (
        <Path
          d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"
          {...stroke}
        />
      ) : null}

      {name === "spark" ? (
        <Path
          d="M12 3 C12.6 8 15 10.4 21 12 C15 13.6 12.6 16 12 21 C11.4 16 9 13.6 3 12 C9 10.4 11.4 8 12 3 Z"
          {...stroke}
        />
      ) : null}

      {name === "pulse" ? (
        <Path d="M3 12 H7.5 L10 6 L14 18 L16.5 12 H21" {...stroke} />
      ) : null}

      {name === "person" ? (
        <>
          <Circle cx={12} cy={8.5} r={3.5} {...stroke} />
          <Path d="M5 20.5 A7 7 0 0 1 19 20.5" {...stroke} />
        </>
      ) : null}

      {name === "people" ? (
        <>
          <Circle cx={9.5} cy={8.5} r={3.3} {...stroke} />
          <Path d="M3.2 20.5 A6.3 6.3 0 0 1 15.8 20.5" {...stroke} />
          {/* El segundo asoma por detrás: media cabeza y medio hombro. */}
          <Path d="M16.2 5.4 A3.3 3.3 0 0 1 16.2 11.6" {...stroke} />
          <Path d="M17.4 14.4 A6.3 6.3 0 0 1 20.8 20" {...stroke} />
        </>
      ) : null}

      {name === "star" ? (
        <Path
          d="M12 3 L14.35 8.76 L20.56 9.22 L15.8 13.24 L17.29 19.28 L12 16 L6.71 19.28 L8.2 13.24 L3.44 9.22 L9.65 8.76 Z"
          {...stroke}
        />
      ) : null}

      {name === "flame" ? (
        <>
          {/* Contorno y lengua interior: con una sola curva se leía como una
              gota, no como una llama. */}
          <Path
            d="M12 2.6 C14.2 6.4 18 8 18 12.6 A6 6 0 0 1 6 12.6 C6 9.4 8.2 8.6 9.4 6.2 C10.1 7.8 10.6 8.4 11.2 8.8 C11.9 7.2 12 5 12 2.6 Z"
            {...stroke}
          />
          <Path
            d="M12 13 C13 14.4 13.6 15.2 13.6 16.4 A1.6 1.6 0 0 1 10.4 16.4 C10.4 15.4 11.2 14.6 12 13 Z"
            {...stroke}
          />
        </>
      ) : null}
    </Svg>
  );
}
