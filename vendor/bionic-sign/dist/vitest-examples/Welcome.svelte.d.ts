export default Welcome;
type Welcome = {
    $on?(type: string, callback: (e: any) => void): () => void;
    $set?(props: Partial<$$ComponentProps>): void;
};
declare const Welcome: import("svelte").Component<{
    host?: string;
    guest?: string;
}, {}, "">;
type $$ComponentProps = {
    host?: string;
    guest?: string;
};
