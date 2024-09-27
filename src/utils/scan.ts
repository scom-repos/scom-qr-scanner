import { binarize } from "./binarizer";
import { BitMatrix } from "./bitMatrix";
import { decode } from "./decoder/decoder";
import { extract } from "./extractor";
import { locate } from "./locator";

export interface QRCode {
  binaryData: number[];
  data: string;
}

function scan(matrix: BitMatrix): QRCode | null {
  const locations = locate(matrix);
  if (!locations) {
    return null;
  }

  for (const location of locations) {
    const extracted = extract(matrix, location);
    const decoded = decode(extracted.matrix);
    if (decoded) {
      return {
        binaryData: decoded.bytes,
        data: decoded.text,
      };
    }
  }
  return null;
}

export interface Options {
  inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
}

const defaultOptions: Options = {
  inversionAttempts: "attemptBoth"
}

export function decodeQRCode(data: Uint8ClampedArray, width: number, height: number, providedOptions: Options = {}): QRCode | null {

  const options = defaultOptions;
  Object.keys(options || {}).forEach(opt => {
    (options as any)[opt] = (providedOptions as any)[opt] || (options as any)[opt];
  });

  const shouldInvert = options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst";
  const tryInvertedFirst = options.inversionAttempts === "onlyInvert" || options.inversionAttempts === "invertFirst";
  const { binarized, inverted } = binarize(data, width, height, shouldInvert);
  const bitMatrix = (tryInvertedFirst ? inverted : binarized) as BitMatrix;
  let result = scan(bitMatrix);
  if (!result && (options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst")) {
    result = scan(bitMatrix);
  }
  return result;
}