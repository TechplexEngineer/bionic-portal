import type { SignatureValue } from '../types.js';
interface Props {
    open: boolean;
    fieldName: string;
    value?: SignatureValue;
    onapply?: (value: SignatureValue) => void;
    oncancel?: () => void;
}
declare const SignatureDialog: import("svelte").Component<Props, {}, "">;
type SignatureDialog = ReturnType<typeof SignatureDialog>;
export default SignatureDialog;
