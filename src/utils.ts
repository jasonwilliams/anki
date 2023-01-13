/**
 * Trim string and replaces spaces with underscore
 * Used for making tags
 */
export const sanitizeString = (str: string) => str.trim().replace(/\s/g, "_");

/**
 * Trim array from end
 */
export const trimArrayEnd = (array: any[]) => {
  const trimmedArray: any[] = [];
  let added = false;

  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (array[i] || added) {
      trimmedArray.unshift(array[i]);
      added = true;
    }
  }

  return trimmedArray;
};

/**
 * Trim array from start
 */
export const trimArrayStart = (array: any[]) => {
  const trimmedArray = [];
  let added = false;

  for (let i = 0; i < array.length; i += 1) {
    if (array[i] || added) {
      trimmedArray.push(array[i]);
      added = true;
    }
  }

  return trimmedArray;
};

/**
 * Trim array
 */
export const trimArray = (array: any[]) => trimArrayEnd(trimArrayStart(array));
