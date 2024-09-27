import { BitMatrix } from "./bitMatrix";

const MAX_FINDERPATTERNS_TO_SEARCH = 4;
const MIN_QUAD_RATIO = 0.5;
const MAX_QUAD_RATIO = 1.5;

export interface Point {
  x: number;
  y: number;
}

export interface QRLocation {
  topRight: Point;
  bottomLeft: Point;
  topLeft: Point;
  alignmentPattern: Point;
  dimension: number;
}

const distance = (a: Point, b: Point) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

function sum(values: number[]) {
  return values.reduce((a, b) => a + b);
}

function reorderFinderPatterns(pattern1: Point, pattern2: Point, pattern3: Point) {
  const oneTwoDistance = distance(pattern1, pattern2);
  const twoThreeDistance = distance(pattern2, pattern3);
  const oneThreeDistance = distance(pattern1, pattern3);

  let bottomLeft: Point;
  let topLeft: Point;
  let topRight: Point;

  if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
    [bottomLeft, topLeft, topRight] = [pattern2, pattern1, pattern3];
  } else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
    [bottomLeft, topLeft, topRight] = [pattern1, pattern2, pattern3];
  } else {
    [bottomLeft, topLeft, topRight] = [pattern1, pattern3, pattern2];
  }

  if (((topRight.x - topLeft.x) * (bottomLeft.y - topLeft.y)) - ((topRight.y - topLeft.y) * (bottomLeft.x - topLeft.x)) < 0) {
    [bottomLeft, topRight] = [topRight, bottomLeft];
  }

  return { bottomLeft, topLeft, topRight };
}

function computeDimension(topLeft: Point, topRight: Point, bottomLeft: Point, matrix: BitMatrix) {
  const moduleSize = (
    sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 +
    sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
    sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
    sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7
  ) / 4;

  if (moduleSize < 1) {
    throw new Error("Invalid module size");
  }

  const topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
  const sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
  let dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
  switch (dimension % 4) {
    case 0:
      dimension++;
      break;
    case 2:
      dimension--;
      break;
  }
  return { dimension, moduleSize };
}

function countBlackWhiteRunTowardsPoint(origin: Point, end: Point, matrix: BitMatrix, length: number) {
  const switchPoints: Point[] = [{ x: Math.floor(origin.x), y: Math.floor(origin.y) }];
  const steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);

  let fromX: number;
  let fromY: number;
  let toX: number;
  let toY: number;
  if (steep) {
    fromX = Math.floor(origin.y);
    fromY = Math.floor(origin.x);
    toX = Math.floor(end.y);
    toY = Math.floor(end.x);
  } else {
    fromX = Math.floor(origin.x);
    fromY = Math.floor(origin.y);
    toX = Math.floor(end.x);
    toY = Math.floor(end.y);
  }

  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  let error = Math.floor(-dx / 2);
  const xStep = fromX < toX ? 1 : -1;
  const yStep = fromY < toY ? 1 : -1;

  let currentPixel = true;
  for (let x = fromX, y = fromY; x !== toX + xStep; x += xStep) {
    const realX = steep ? y : x;
    const realY = steep ? x : y;
    if (matrix.get(realX, realY) !== currentPixel) {
      currentPixel = !currentPixel;
      switchPoints.push({ x: realX, y: realY });
      if (switchPoints.length === length + 1) {
        break;
      }
    }
    error += dy;
    if (error > 0) {
      if (y === toY) {
        break;
      }
      y += yStep;
      error -= dx;
    }
  }
  const distances: number[] = [];
  for (let i = 0; i < length; i++) {
    if (switchPoints[i] && switchPoints[i + 1]) {
      distances.push(distance(switchPoints[i], switchPoints[i + 1]));
    } else {
      distances.push(0);
    }
  }
  return distances;
}

function countBlackWhiteRun(origin: Point, end: Point, matrix: BitMatrix, length: number) {
  const rise = end.y - origin.y;
  const run = end.x - origin.x;

  const towardsEnd: any = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
  const awayFromEnd: any = countBlackWhiteRunTowardsPoint(origin, { x: origin.x - run, y: origin.y - rise }, matrix, Math.ceil(length / 2));

  const middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1;
  return awayFromEnd.concat(middleValue).concat(...towardsEnd);
}

function scoreBlackWhiteRun(sequence: number[], ratios: number[]) {
  const averageSize = sum(sequence) / sum(ratios);
  let error = 0;
  ratios.forEach((ratio, i) => {
    error += (sequence[i] - ratio * averageSize) ** 2;
  });

  return { averageSize, error };
}

function scorePattern(point: Point, ratios: number[], matrix: BitMatrix) {
  try {
    const horizontalRun = countBlackWhiteRun(point, { x: -1, y: point.y }, matrix, ratios.length);
    const verticalRun = countBlackWhiteRun(point, { x: point.x, y: -1 }, matrix, ratios.length);

    const topLeftPoint = {
      x: Math.max(0, point.x - point.y) - 1,
      y: Math.max(0, point.y - point.x) - 1,
    };
    const topLeftBottomRightRun = countBlackWhiteRun(point, topLeftPoint, matrix, ratios.length);

    const bottomLeftPoint = {
      x: Math.min(matrix.width, point.x + point.y) + 1,
      y: Math.min(matrix.height, point.y + point.x) + 1,
    };
    const bottomLeftTopRightRun = countBlackWhiteRun(point, bottomLeftPoint, matrix, ratios.length);

    const horzError = scoreBlackWhiteRun(horizontalRun, ratios);
    const vertError = scoreBlackWhiteRun(verticalRun, ratios);
    const diagDownError = scoreBlackWhiteRun(topLeftBottomRightRun, ratios);
    const diagUpError = scoreBlackWhiteRun(bottomLeftTopRightRun, ratios);

    const ratioError = Math.sqrt(horzError.error * horzError.error +
      vertError.error * vertError.error +
      diagDownError.error * diagDownError.error +
      diagUpError.error * diagUpError.error);

    const avgSize = (horzError.averageSize + vertError.averageSize + diagDownError.averageSize + diagUpError.averageSize) / 4;

    const sizeError = ((horzError.averageSize - avgSize) ** 2 +
      (vertError.averageSize - avgSize) ** 2 +
      (diagDownError.averageSize - avgSize) ** 2 +
      (diagUpError.averageSize - avgSize) ** 2) / avgSize;
    return ratioError + sizeError;
  } catch {
    return Infinity;
  }
}

function recenterLocation(matrix: BitMatrix, p: Point): Point {
  let leftX = Math.round(p.x);
  while (matrix.get(leftX, Math.round(p.y))) {
    leftX--;
  }
  let rightX = Math.round(p.x);
  while (matrix.get(rightX, Math.round(p.y))) {
    rightX++;
  }
  const x = (leftX + rightX) / 2;

  let topY = Math.round(p.y);
  while (matrix.get(Math.round(x), topY)) {
    topY--;
  }
  let bottomY = Math.round(p.y);
  while (matrix.get(Math.round(x), bottomY)) {
    bottomY++;
  }
  const y = (topY + bottomY) / 2;

  return { x, y };
}

interface Quad {
  top: {
    startX: number;
    endX: number;
    y: number;
  };
  bottom: {
    startX: number;
    endX: number;
    y: number;
  };
}

export function locate(matrix: BitMatrix): QRLocation[] | null {
  const finderPatternQuads: Quad[] = [];
  let activeFinderPatternQuads: Quad[] = [];
  const alignmentPatternQuads: Quad[] = [];
  let activeAlignmentPatternQuads: Quad[] = [];

  for (let y = 0; y <= matrix.height; y++) {
    let length = 0;
    let lastBit = false;
    let scans = [0, 0, 0, 0, 0];

    for (let x = -1; x <= matrix.width; x++) {
      const v = matrix.get(x, y);
      if (v === lastBit) {
        length++;
      } else {
        scans = [scans[1], scans[2], scans[3], scans[4], length];
        length = 1;
        lastBit = v;

        const averageFinderPatternBlocksize = sum(scans) / 7;
        const validFinderPattern =
          Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
          Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          !v;

        const averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
        const validAlignmentPattern =
          Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
          Math.abs(scans[3] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
          Math.abs(scans[4] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
          v;

        if (validFinderPattern) {
          const endX = x - scans[3] - scans[4];
          const startX = endX - scans[2];

          const line = { startX, endX, y };
          const matchingQuads = activeFinderPatternQuads.filter(q =>
            (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (startX <= q.bottom.startX && endX >= q.bottom.endX && (
              (scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
              (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO
            )),
          );
          if (matchingQuads.length > 0) {
            matchingQuads[0].bottom = line;
          } else {
            activeFinderPatternQuads.push({ top: line, bottom: line });
          }
        }
        if (validAlignmentPattern) {
          const endX = x - scans[4];
          const startX = endX - scans[3];

          const line = { startX, y, endX };
          const matchingQuads = activeAlignmentPatternQuads.filter(q =>
            (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (startX <= q.bottom.startX && endX >= q.bottom.endX && (
              (scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
              (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO
            )),
          );
          if (matchingQuads.length > 0) {
            matchingQuads[0].bottom = line;
          } else {
            activeAlignmentPatternQuads.push({ top: line, bottom: line });
          }
        }
      }
    }
    finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y !== y && q.bottom.y - q.top.y >= 2));
    activeFinderPatternQuads = activeFinderPatternQuads.filter(q => q.bottom.y === y);

    alignmentPatternQuads.push(...activeAlignmentPatternQuads.filter(q => q.bottom.y !== y));
    activeAlignmentPatternQuads = activeAlignmentPatternQuads.filter(q => q.bottom.y === y);

  }

  finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y - q.top.y >= 2));
  alignmentPatternQuads.push(...activeAlignmentPatternQuads);

  const finderPatternGroups = finderPatternQuads
    .filter(q => q.bottom.y - q.top.y >= 2)
    .map(q => {
      const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
      const y = (q.top.y + q.bottom.y + 1) / 2;
      if (!matrix.get(Math.round(x), Math.round(y))) {
        return;
      }

      const lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, q.bottom.y - q.top.y + 1];
      const size = sum(lengths) / lengths.length;
      const score = scorePattern({ x: Math.round(x), y: Math.round(y) }, [1, 1, 3, 1, 1], matrix);
      return { score, x, y, size };
    })
    .filter(q => !!q)
    .sort((a, b) => a.score - b.score)
    .map((point, i, finderPatterns) => {
      if (i > MAX_FINDERPATTERNS_TO_SEARCH) {
        return null;
      }
      const otherPoints = finderPatterns
        .filter((p, ii) => i !== ii)
        .map(p => ({ x: p.x, y: p.y, score: p.score + ((p.size - point.size) ** 2) / point.size, size: p.size }))
        .sort((a, b) => a.score - b.score);
      if (otherPoints.length < 2) {
        return null;
      }
      const score = point.score + otherPoints[0].score + otherPoints[1].score;
      return { points: [point].concat(otherPoints.slice(0, 2)), score };
    })
    .filter(q => !!q)
    .sort((a, b) => a.score - b.score);

  if (finderPatternGroups.length === 0) {
    return null;
  }

  const { topRight, topLeft, bottomLeft } = reorderFinderPatterns(
    finderPatternGroups[0].points[0], finderPatternGroups[0].points[1], finderPatternGroups[0].points[2],
  );
  const alignment = findAlignmentPattern(matrix, alignmentPatternQuads, topRight, topLeft, bottomLeft);
  const result: QRLocation[] = [];
  if (alignment) {
    result.push({
      alignmentPattern: { x: alignment.alignmentPattern.x, y: alignment.alignmentPattern.y },
      bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
      dimension: alignment.dimension,
      topLeft: { x: topLeft.x, y: topLeft.y },
      topRight: { x: topRight.x, y: topRight.y },
    });
  }

  const midTopRight = recenterLocation(matrix, topRight);
  const midTopLeft = recenterLocation(matrix, topLeft);
  const midBottomLeft = recenterLocation(matrix, bottomLeft);
  const centeredAlignment = findAlignmentPattern(matrix, alignmentPatternQuads, midTopRight, midTopLeft, midBottomLeft);
  if (centeredAlignment) {
    result.push({
      alignmentPattern: { x: centeredAlignment.alignmentPattern.x, y: centeredAlignment.alignmentPattern.y },
      bottomLeft: { x: midBottomLeft.x, y: midBottomLeft.y },
      topLeft: { x: midTopLeft.x, y: midTopLeft.y },
      topRight: { x: midTopRight.x, y: midTopRight.y },
      dimension: centeredAlignment.dimension,
    });
  }

  if (result.length === 0) {
    return null;
  }

  return result;
}

function findAlignmentPattern(matrix: BitMatrix, alignmentPatternQuads: Quad[], topRight: Point, topLeft: Point, bottomLeft: Point) {
  let dimension: number;
  let moduleSize: number;
  try {
    ({ dimension, moduleSize } = computeDimension(topLeft, topRight, bottomLeft, matrix));
  } catch (e) {
    return null;
  }

  const bottomRightFinderPattern = {
    x: topRight.x - topLeft.x + bottomLeft.x,
    y: topRight.y - topLeft.y + bottomLeft.y,
  };
  const modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);
  const correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
  const expectedAlignmentPattern = {
    x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
    y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
  };

  const alignmentPatterns = alignmentPatternQuads
    .map(q => {
      const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
      const y = (q.top.y + q.bottom.y + 1) / 2;
      if (!matrix.get(Math.floor(x), Math.floor(y))) {
        return;
      }

      const sizeScore = scorePattern({ x: Math.floor(x), y: Math.floor(y) }, [1, 1, 1], matrix);
      const score = sizeScore + distance({ x, y }, expectedAlignmentPattern);
      return { x, y, score };
    })
    .filter(v => !!v)
    .sort((a, b) => a.score - b.score);

  const alignmentPattern = modulesBetweenFinderPatterns >= 15 && alignmentPatterns.length ? alignmentPatterns[0] : expectedAlignmentPattern;

  return { alignmentPattern, dimension };
}