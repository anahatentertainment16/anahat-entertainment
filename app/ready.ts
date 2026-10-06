// Resolves when the loading screen starts to lift, so entrance animations play in view, not under it.
let resolve: () => void = () => {};
export const siteReady = new Promise<void>((r) => (resolve = r));
export const markReady = () => resolve();
