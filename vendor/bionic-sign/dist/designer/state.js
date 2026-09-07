import { nextFieldName, validateDefinition } from '../schema.js';
export const MIN_FIELD_SIZE = 0.02;
const DEFAULT_FIELD_RECTS = {
    text: { x: 0.1, y: 0.1, width: 0.3, height: 0.1 },
    dropdown: { x: 0.1, y: 0.1, width: 0.3, height: 0.1 },
    signature: { x: 0.1, y: 0.1, width: 0.3, height: 0.15 }
};
function assertFiniteRect(rect) {
    for (const [property, value] of Object.entries(rect)) {
        if (!Number.isFinite(value)) {
            throw new TypeError(`Field rect.${property} must be a finite number`);
        }
    }
}
function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}
export function constrainFieldRect(rect) {
    assertFiniteRect(rect);
    const x = clamp(rect.x, 0, 1 - MIN_FIELD_SIZE);
    const y = clamp(rect.y, 0, 1 - MIN_FIELD_SIZE);
    return {
        x,
        y,
        width: clamp(rect.width, MIN_FIELD_SIZE, 1 - x),
        height: clamp(rect.height, MIN_FIELD_SIZE, 1 - y)
    };
}
export function constrainMovedFieldRect(rect) {
    assertFiniteRect(rect);
    if (rect.width < MIN_FIELD_SIZE ||
        rect.height < MIN_FIELD_SIZE ||
        rect.width > 1 ||
        rect.height > 1) {
        throw new RangeError('Moved field dimensions must already fit within the normalized page');
    }
    return {
        x: clamp(rect.x, 0, 1 - rect.width),
        y: clamp(rect.y, 0, 1 - rect.height),
        width: rect.width,
        height: rect.height
    };
}
function updateField(definition, id, update) {
    let found = false;
    const fields = definition.fields.map((field) => {
        if (field.id !== id)
            return field;
        found = true;
        return update(field);
    });
    if (!found) {
        throw new RangeError(`No field with id "${id}" exists`);
    }
    return validateDefinition({ version: 1, fields });
}
export function addField(definition, type, page, rect = DEFAULT_FIELD_RECTS[type]) {
    const base = {
        id: globalThis.crypto.randomUUID(),
        name: nextFieldName(type, definition.fields),
        page,
        rect: constrainFieldRect(rect),
        required: true
    };
    const field = type === 'dropdown'
        ? { ...base, type: 'dropdown', options: ['Option 1'] }
        : type === 'text'
            ? { ...base, type: 'text' }
            : { ...base, type: 'signature' };
    return validateDefinition({ version: 1, fields: [...definition.fields, field] });
}
export function renameField(definition, id, name) {
    return updateField(definition, id, (field) => ({ ...field, name }));
}
export function updateFieldRect(definition, id, rect) {
    return updateField(definition, id, (field) => ({
        ...field,
        rect: constrainFieldRect(rect)
    }));
}
export function toggleRequired(definition, id) {
    return updateField(definition, id, (field) => ({ ...field, required: !field.required }));
}
export function updateDropdownOptions(definition, id, options) {
    return updateField(definition, id, (field) => {
        if (field.type !== 'dropdown') {
            throw new TypeError(`Field "${field.name}" is not a dropdown`);
        }
        return { ...field, options: [...options] };
    });
}
export function deleteField(definition, id) {
    if (!definition.fields.some((field) => field.id === id)) {
        throw new RangeError(`No field with id "${id}" exists`);
    }
    return validateDefinition({
        version: 1,
        fields: definition.fields.filter((field) => field.id !== id)
    });
}
