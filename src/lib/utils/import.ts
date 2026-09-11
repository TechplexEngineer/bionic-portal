export interface ImportField {
    name: string;
    label: string;
    searchTerms: string[];
    required?: boolean;
}

// Excel's epoch starts at Jan 0, 1900 (with a known leap-year bug for 1900).
// 25569 is the number of days from the Excel epoch to the Unix epoch (Jan 1, 1970).
const EXCEL_EPOCH_OFFSET_DAYS = 25569;

function excelSerialToDate(serial: number): Date {
    return new Date(Math.round((serial - EXCEL_EPOCH_OFFSET_DAYS) * 86400 * 1000));
}

export function parseDate(val: unknown): string {
    if (val === null || val === undefined || val === "") return "";
    let d: Date;
    if (val instanceof Date) {
        d = val;
    } else if (typeof val === "number") {
        d = excelSerialToDate(val);
    } else {
        d = new Date(String(val));
    }
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
}

export function parseDateTime(val: unknown): string {
    if (val === null || val === undefined || val === "") return "";
    let d: Date;
    if (val instanceof Date) {
        d = val;
    } else if (typeof val === "number") {
        d = excelSerialToDate(val);
    } else {
        d = new Date(String(val));
    }
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
}

export function parseBoolean(val: unknown): boolean {
    if (val === undefined || val === null) return false;
    const s = String(val).toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "on";
}

export function autoMap(fileHeaders: string[], fields: ImportField[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const normalizedHeaders = fileHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

    fields.forEach((field) => {
        const index = normalizedHeaders.findIndex((h) =>
            field.searchTerms.some((term) => h.includes(term.toLowerCase()))
        );
        if (index !== -1) {
            mapping[field.name] = fileHeaders[index];
        } else {
            mapping[field.name] = "";
        }
    });

    return mapping;
}
