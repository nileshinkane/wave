const SQRT3 = Math.sqrt(3.0);
const F2 = 0.5 * (SQRT3 - 1.0);
const G2 = (3.0 - SQRT3) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

const fastFloor = (value: number) => Math.floor(value) | 0;

const grad2 = new Float64Array([
  1, 1, -1, 1, 1, -1,
  -1, -1, 1, 0, -1, 0,
  1, 0, -1, 0, 0, 1,
  0, -1, 0, 1, 0, -1,
]);

const grad3 = new Float64Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0,
  -1, -1, 0, 1, 0, 1, -1, 0, 1,
  1, 0, -1, -1, 0, -1, 0, 1, 1,
  0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

export type RandomFn = () => number;
export type NoiseFunction2D = (x: number, y: number) => number;
export type NoiseFunction3D = (x: number, y: number, z: number) => number;

export function createNoise2D(random: RandomFn = Math.random): NoiseFunction2D {
  const permutation = buildPermutationTable(random);
  const permutationGradientX = new Float64Array(permutation).map(
    (value) => grad2[(value % 12) * 2],
  );
  const permutationGradientY = new Float64Array(permutation).map(
    (value) => grad2[(value % 12) * 2 + 1],
  );

  return (x: number, y: number): number => {
    let contribution0 = 0;
    let contribution1 = 0;
    let contribution2 = 0;

    const skew = (x + y) * F2;
    const i = fastFloor(x + skew);
    const j = fastFloor(y + skew);
    const unskew = (i + j) * G2;
    const originX = i - unskew;
    const originY = j - unskew;
    const deltaX0 = x - originX;
    const deltaY0 = y - originY;

    const simplexOffsetX = deltaX0 > deltaY0 ? 1 : 0;
    const simplexOffsetY = deltaX0 > deltaY0 ? 0 : 1;

    const deltaX1 = deltaX0 - simplexOffsetX + G2;
    const deltaY1 = deltaY0 - simplexOffsetY + G2;
    const deltaX2 = deltaX0 - 1.0 + 2.0 * G2;
    const deltaY2 = deltaY0 - 1.0 + 2.0 * G2;

    const wrappedI = i & 255;
    const wrappedJ = j & 255;

    let attenuation0 = 0.5 - deltaX0 * deltaX0 - deltaY0 * deltaY0;
    if (attenuation0 >= 0) {
      const gradientIndex = wrappedI + permutation[wrappedJ];
      const gradientX = permutationGradientX[gradientIndex];
      const gradientY = permutationGradientY[gradientIndex];
      attenuation0 *= attenuation0;
      contribution0 =
        attenuation0 * attenuation0 * (gradientX * deltaX0 + gradientY * deltaY0);
    }

    let attenuation1 = 0.5 - deltaX1 * deltaX1 - deltaY1 * deltaY1;
    if (attenuation1 >= 0) {
      const gradientIndex =
        wrappedI + simplexOffsetX + permutation[wrappedJ + simplexOffsetY];
      const gradientX = permutationGradientX[gradientIndex];
      const gradientY = permutationGradientY[gradientIndex];
      attenuation1 *= attenuation1;
      contribution1 =
        attenuation1 * attenuation1 * (gradientX * deltaX1 + gradientY * deltaY1);
    }

    let attenuation2 = 0.5 - deltaX2 * deltaX2 - deltaY2 * deltaY2;
    if (attenuation2 >= 0) {
      const gradientIndex = wrappedI + 1 + permutation[wrappedJ + 1];
      const gradientX = permutationGradientX[gradientIndex];
      const gradientY = permutationGradientY[gradientIndex];
      attenuation2 *= attenuation2;
      contribution2 =
        attenuation2 * attenuation2 * (gradientX * deltaX2 + gradientY * deltaY2);
    }

    return 70.0 * (contribution0 + contribution1 + contribution2);
  };
}

export function createNoise3D(random: RandomFn = Math.random): NoiseFunction3D {
  const permutation = buildPermutationTable(random);
  const permutationGradientX = new Float64Array(permutation).map(
    (value) => grad3[(value % 12) * 3],
  );
  const permutationGradientY = new Float64Array(permutation).map(
    (value) => grad3[(value % 12) * 3 + 1],
  );
  const permutationGradientZ = new Float64Array(permutation).map(
    (value) => grad3[(value % 12) * 3 + 2],
  );

  return (x: number, y: number, z: number): number => {
    let contribution0 = 0;
    let contribution1 = 0;
    let contribution2 = 0;
    let contribution3 = 0;

    const skew = (x + y + z) * F3;
    const i = fastFloor(x + skew);
    const j = fastFloor(y + skew);
    const k = fastFloor(z + skew);
    const unskew = (i + j + k) * G3;
    const originX = i - unskew;
    const originY = j - unskew;
    const originZ = k - unskew;
    const deltaX0 = x - originX;
    const deltaY0 = y - originY;
    const deltaZ0 = z - originZ;

    let offset1X: number;
    let offset1Y: number;
    let offset1Z: number;
    let offset2X: number;
    let offset2Y: number;
    let offset2Z: number;

    if (deltaX0 >= deltaY0) {
      if (deltaY0 >= deltaZ0) {
        offset1X = 1;
        offset1Y = 0;
        offset1Z = 0;
        offset2X = 1;
        offset2Y = 1;
        offset2Z = 0;
      } else if (deltaX0 >= deltaZ0) {
        offset1X = 1;
        offset1Y = 0;
        offset1Z = 0;
        offset2X = 1;
        offset2Y = 0;
        offset2Z = 1;
      } else {
        offset1X = 0;
        offset1Y = 0;
        offset1Z = 1;
        offset2X = 1;
        offset2Y = 0;
        offset2Z = 1;
      }
    } else if (deltaY0 < deltaZ0) {
      offset1X = 0;
      offset1Y = 0;
      offset1Z = 1;
      offset2X = 0;
      offset2Y = 1;
      offset2Z = 1;
    } else if (deltaX0 < deltaZ0) {
      offset1X = 0;
      offset1Y = 1;
      offset1Z = 0;
      offset2X = 0;
      offset2Y = 1;
      offset2Z = 1;
    } else {
      offset1X = 0;
      offset1Y = 1;
      offset1Z = 0;
      offset2X = 1;
      offset2Y = 1;
      offset2Z = 0;
    }

    const deltaX1 = deltaX0 - offset1X + G3;
    const deltaY1 = deltaY0 - offset1Y + G3;
    const deltaZ1 = deltaZ0 - offset1Z + G3;
    const deltaX2 = deltaX0 - offset2X + 2.0 * G3;
    const deltaY2 = deltaY0 - offset2Y + 2.0 * G3;
    const deltaZ2 = deltaZ0 - offset2Z + 2.0 * G3;
    const deltaX3 = deltaX0 - 1.0 + 3.0 * G3;
    const deltaY3 = deltaY0 - 1.0 + 3.0 * G3;
    const deltaZ3 = deltaZ0 - 1.0 + 3.0 * G3;

    const wrappedI = i & 255;
    const wrappedJ = j & 255;
    const wrappedK = k & 255;

    let attenuation0 = 0.6 - deltaX0 * deltaX0 - deltaY0 * deltaY0 - deltaZ0 * deltaZ0;
    if (attenuation0 > 0) {
      const gradientIndex = wrappedI + permutation[wrappedJ + permutation[wrappedK]];
      attenuation0 *= attenuation0;
      contribution0 =
        attenuation0 *
        attenuation0 *
        (permutationGradientX[gradientIndex] * deltaX0 +
          permutationGradientY[gradientIndex] * deltaY0 +
          permutationGradientZ[gradientIndex] * deltaZ0);
    }

    let attenuation1 = 0.6 - deltaX1 * deltaX1 - deltaY1 * deltaY1 - deltaZ1 * deltaZ1;
    if (attenuation1 > 0) {
      const gradientIndex =
        wrappedI +
        offset1X +
        permutation[wrappedJ + offset1Y + permutation[wrappedK + offset1Z]];
      attenuation1 *= attenuation1;
      contribution1 =
        attenuation1 *
        attenuation1 *
        (permutationGradientX[gradientIndex] * deltaX1 +
          permutationGradientY[gradientIndex] * deltaY1 +
          permutationGradientZ[gradientIndex] * deltaZ1);
    }

    let attenuation2 = 0.6 - deltaX2 * deltaX2 - deltaY2 * deltaY2 - deltaZ2 * deltaZ2;
    if (attenuation2 > 0) {
      const gradientIndex =
        wrappedI +
        offset2X +
        permutation[wrappedJ + offset2Y + permutation[wrappedK + offset2Z]];
      attenuation2 *= attenuation2;
      contribution2 =
        attenuation2 *
        attenuation2 *
        (permutationGradientX[gradientIndex] * deltaX2 +
          permutationGradientY[gradientIndex] * deltaY2 +
          permutationGradientZ[gradientIndex] * deltaZ2);
    }

    let attenuation3 = 0.6 - deltaX3 * deltaX3 - deltaY3 * deltaY3 - deltaZ3 * deltaZ3;
    if (attenuation3 > 0) {
      const gradientIndex = wrappedI + 1 + permutation[wrappedJ + 1 + permutation[wrappedK + 1]];
      attenuation3 *= attenuation3;
      contribution3 =
        attenuation3 *
        attenuation3 *
        (permutationGradientX[gradientIndex] * deltaX3 +
          permutationGradientY[gradientIndex] * deltaY3 +
          permutationGradientZ[gradientIndex] * deltaZ3);
    }

    return 32.0 * (contribution0 + contribution1 + contribution2 + contribution3);
  };
}

export function buildPermutationTable(random: RandomFn): Uint8Array {
  const tableSize = 512;
  const permutation = new Uint8Array(tableSize);

  for (let index = 0; index < tableSize / 2; index += 1) {
    permutation[index] = index;
  }

  for (let index = 0; index < tableSize / 2 - 1; index += 1) {
    const randomIndex = index + ~~(random() * (256 - index));
    const currentValue = permutation[index];
    permutation[index] = permutation[randomIndex];
    permutation[randomIndex] = currentValue;
  }

  for (let index = 256; index < tableSize; index += 1) {
    permutation[index] = permutation[index - 256];
  }

  return permutation;
}
