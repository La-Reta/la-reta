import Svg, { Path } from "react-native-svg";

/**
 * Los logos de Google Maps y Apple, tal cual son.
 *
 * Van aparte del set de iconos de la app porque son marcas ajenas: el resto se
 * dibuja de línea, con un solo trazo y el color que le pase quien lo use, y
 * estos dos tienen que respetar su forma y sus colores o dejan de reconocerse
 * —que es justo lo que se busca al ponerlos en un menú de "abrir con".
 */

export function GoogleMapsMark({ size = 22 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M14.462.391a8.33 8.33 0 0 0-8.91 2.586l3.945 3.316Z"
        fill="#1a73e8"
      />
      <Path
        d="M5.552 2.977a8.3 8.3 0 0 0-1.947 5.356a9.3 9.3 0 0 0 .824 3.976l5.068-6.016Z"
        fill="#ea4335"
      />
      <Path
        d="M11.938 5.15a3.183 3.183 0 0 1 3.193 3.183a3.15 3.15 0 0 1-.762 2.06l4.964-5.902A8.36 8.36 0 0 0 14.461.37L9.497 6.293a3.16 3.16 0 0 1 2.441-1.143"
        fill="#4285f4"
      />
      <Path
        d="M11.938 11.526a3.193 3.193 0 0 1-3.193-3.193a3.16 3.16 0 0 1 .752-2.06l-5.068 6.035a29.5 29.5 0 0 0 3.78 5.408l6.18-7.323a3.16 3.16 0 0 1-2.451 1.133"
        fill="#fbbc04"
      />
      <Path
        d="M14.256 19.714c2.78-4.346 6.015-6.324 6.015-11.33a8.34 8.34 0 0 0-.938-3.842L8.21 17.716c.474.618.948 1.277 1.412 1.998c1.699 2.616 1.225 4.182 2.317 4.182s.618-1.566 2.317-4.182"
        fill="#34a853"
      />
    </Svg>
  );
}

export function AppleMark({
  size = 22,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg height={size} viewBox="0 0 1024 1024" width={size}>
      <Path
        d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5c-34.9-50-87.7-77.5-157.3-82.8c-65.9-5.2-138 38.4-164.4 38.4c-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8c23.8 68.2 109.6 235.3 199.1 232.6c46.8-1.1 79.9-33.2 140.8-33.2c59.1 0 89.7 33.2 141.9 33.2c90.3-1.3 167.9-153.2 190.5-221.6c-121.1-57.1-114.6-167.2-114.6-170.7m-105.1-305c50.7-60.2 46.1-115 44.6-134.7c-44.8 2.6-96.6 30.5-126.1 64.8c-32.5 36.8-51.6 82.3-47.5 133.6c48.4 3.7 92.6-21.2 129-63.7"
        fill={color}
      />
    </Svg>
  );
}
