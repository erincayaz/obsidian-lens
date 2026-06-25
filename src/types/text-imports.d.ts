/**
 * Module declarations for files inlined by esbuild's "text" loader.
 * These imports return the file content as a plain string at compile time.
 */
declare module "*.ps1" {
	const content: string;
	export default content;
}

declare module "*.swift" {
	const content: string;
	export default content;
}