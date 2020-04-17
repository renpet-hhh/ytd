export type ScaleLinear = ((x: number) => number) & {
	inverse: (x: number) => number;
};
interface ScaleLinearConstructor {
	(domain: [number, number], range: [number, number]): ScaleLinear;
	(domain: [number, number], range: [number, number], x: number): number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scaleLinear: ScaleLinearConstructor = (domain: any, range: any, x?: any) => {
	if (x === undefined) {
		const scale = ((t: number) =>
			((range[1] - range[0]) / (domain[1] - domain[0])) * (t - domain[0]) +
			range[0]) as ScaleLinear;
		scale.inverse = (t: number) =>
			((t - range[0]) * (domain[1] - domain[0])) / (range[1] - range[0]) + domain[0];
		return scale;
	}
	return ((range[1] - range[0]) / (domain[1] - domain[0])) * (x - domain[0]) + range[0];
};
export default scaleLinear;
