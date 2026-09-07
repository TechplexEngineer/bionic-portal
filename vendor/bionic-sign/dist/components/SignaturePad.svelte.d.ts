import type { SignatureValue } from '../types.js';
interface Props {
    value?: SignatureValue;
    onchange?: (value: SignatureValue | undefined) => void;
    onemptychange?: (empty: boolean) => void;
}
declare const SignaturePad: import("svelte").Component<Props, {
    clear: () => void;
    toValue: () => SignatureValue | undefined;
}, "">;
type SignaturePad = ReturnType<typeof SignaturePad>;
export default SignaturePad;
