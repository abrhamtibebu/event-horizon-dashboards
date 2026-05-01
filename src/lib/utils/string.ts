/**
 * Decodes HTML entities in a string.
 * Specifically handles &amp; -> & but can be expanded.
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
    if (!str || typeof str !== 'string') return str || '';

    let previousStr = '';
    let currentStr = str;
    
    // Decode recursively to handle things like &amp;amp;
    let iterations = 0;
    while (previousStr !== currentStr && iterations < 5) {
        previousStr = currentStr;
        currentStr = currentStr
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#039;/g, "'")
            .replace(/&apos;/gi, "'");
        iterations++;
    }

    return currentStr;
}

/**
 * Recursively decodes HTML entities in all string properties of an object or array.
 */
export function decodeObjectStrings(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        return decodeHtmlEntities(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => decodeObjectStrings(item));
    }

    // Process only plain objects to avoid breaking Dates, Files, Blobs, etc.
    if (typeof obj === 'object' && obj.constructor === Object) {
        const decodedObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                decodedObj[key] = decodeObjectStrings(obj[key]);
            }
        }
        return decodedObj;
    }

    return obj;
}
