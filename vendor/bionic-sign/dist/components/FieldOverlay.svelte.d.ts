import type { FieldRect, FormField } from '../types.js';
interface Props {
    field: FormField;
    width: number;
    height: number;
    selected?: boolean;
    onselect?: (id: string) => void;
    onrectchange?: (rect: FieldRect) => void;
    ondelete?: (id: string) => void;
}
declare const FieldOverlay: import("svelte").Component<Props, {}, "">;
type FieldOverlay = ReturnType<typeof FieldOverlay>;
export default FieldOverlay;
