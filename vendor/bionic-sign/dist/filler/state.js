import { applyTextPrefill } from '../schema.js';
function cloneValue(value) {
    return value.type === 'text'
        ? { type: 'text', value: value.value }
        : { type: 'signature', image: value.image };
}
export function cloneValues(values) {
    return Object.assign(Object.create(null), Object.fromEntries(Object.entries(values).map(([name, value]) => [name, cloneValue(value)])));
}
export function createFillerState(definition, prefill = {}) {
    const result = applyTextPrefill(definition, { ...prefill });
    return {
        values: cloneValues(result.values),
        diagnostics: result.diagnostics.map((value) => ({ ...value }))
    };
}
export function setTextValue(values, fieldName, value) {
    return {
        ...cloneValues(values),
        [fieldName]: { type: 'text', value }
    };
}
export function setSignatureValue(values, fieldName, value) {
    return {
        ...cloneValues(values),
        [fieldName]: { type: 'signature', image: value.image }
    };
}
export function clearFieldValue(values, fieldName) {
    const next = cloneValues(values);
    delete next[fieldName];
    return next;
}
export function isFieldComplete(field, values) {
    const value = values[field.name];
    if (!value)
        return false;
    if (field.type === 'signature') {
        return value.type === 'signature' && value.image.length > 0;
    }
    if (value.type !== 'text' || value.value.trim().length === 0)
        return false;
    return field.type === 'text' || field.options.includes(value.value);
}
export function requiredProgress(definition, values) {
    const required = definition.fields.filter((field) => field.required);
    const completed = required.filter((field) => isFieldComplete(field, values)).length;
    return { completed, total: required.length, remaining: required.length - completed };
}
function requiredIssue(field) {
    return {
        code: 'required-field',
        message: `Field "${field.name}" is required`,
        fieldName: field.name
    };
}
export function validateFiller(definition, values) {
    const issues = definition.fields
        .filter((field) => field.required && !isFieldComplete(field, values))
        .map(requiredIssue);
    return { valid: issues.length === 0, issues };
}
export function firstInvalidField(definition, values) {
    return definition.fields.find((field) => field.required && !isFieldComplete(field, values));
}
export function submissionValues(definition, values) {
    const submitted = {};
    for (const field of definition.fields) {
        if (!isFieldComplete(field, values))
            continue;
        const value = values[field.name];
        if (value)
            submitted[field.name] = cloneValue(value);
    }
    return submitted;
}
