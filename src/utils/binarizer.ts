import { BitMatrix } from "./bitMatrix";

const REGION_SIZE = 8;
const MIN_DYNAMIC_RANGE = 24;

function numBetween(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

class Matrix {
  private data: Uint8ClampedArray;
  private width: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.data = new Uint8ClampedArray(width * height);
  }
  public get(x: number, y: number) {
    return this.data[y * this.width + x];
  }
  public set(x: number, y: number, value: number) {
    this.data[y * this.width + x] = value;
  }
}

export function binarize(data: Uint8ClampedArray, width: number, height: number, returnInverted: boolean) {
  if (data.length !== width * height * 4) {
    throw new Error("Malformed data passed to binarizer.");
  }
  const greyscalePixels = new Matrix(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const r = data[((y * width + x) * 4) + 0];
      const g = data[((y * width + x) * 4) + 1];
      const b = data[((y * width + x) * 4) + 2];
      greyscalePixels.set(x, y, 0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
  }
  const horizontalRegionCount = Math.ceil(width / REGION_SIZE);
  const verticalRegionCount = Math.ceil(height / REGION_SIZE);

  const blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount);
  for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
    for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
      let sum = 0;
      let min = Infinity;
      let max = 0;
      for (let y = 0; y < REGION_SIZE; y++) {
        for (let x = 0; x < REGION_SIZE; x++) {
          const pixelLumosity =
            greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
          sum += pixelLumosity;
          min = Math.min(min, pixelLumosity);
          max = Math.max(max, pixelLumosity);
        }
      }

      let average = sum / (REGION_SIZE ** 2);
      if (max - min <= MIN_DYNAMIC_RANGE) {
        average = min / 2;

        if (verticalRegion > 0 && hortizontalRegion > 0) {
          const averageNeighborBlackPoint = (
            blackPoints.get(hortizontalRegion, verticalRegion - 1) +
            (2 * blackPoints.get(hortizontalRegion - 1, verticalRegion)) +
            blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)
          ) / 4;
          if (min < averageNeighborBlackPoint) {
            average = averageNeighborBlackPoint;
          }
        }
      }
      blackPoints.set(hortizontalRegion, verticalRegion, average);
    }
  }

  const binarized = BitMatrix.createEmpty(width, height);
  let inverted: BitMatrix | null = null;
  if (returnInverted) {
    inverted = BitMatrix.createEmpty(width, height);
  }
  for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
    for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
      const left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
      const top = numBetween(verticalRegion, 2, verticalRegionCount - 3);
      let sum = 0;
      for (let xRegion = -2; xRegion <= 2; xRegion++) {
        for (let yRegion = -2; yRegion <= 2; yRegion++) {
          sum += blackPoints.get(left + xRegion, top + yRegion);
        }
      }
      const threshold = sum / 25;
      for (let xRegion = 0; xRegion < REGION_SIZE; xRegion++) {
        for (let yRegion = 0; yRegion < REGION_SIZE; yRegion++) {
          const x = hortizontalRegion * REGION_SIZE + xRegion;
          const y = verticalRegion * REGION_SIZE + yRegion;
          const lum = greyscalePixels.get(x, y);
          binarized.set(x, y, lum <= threshold);
          if (returnInverted) {
            (inverted as BitMatrix).set(x, y, !(lum <= threshold));
          }
        }
      }
    }
  }
  if (returnInverted) {
    return { binarized, inverted };
  }
  return { binarized };
}