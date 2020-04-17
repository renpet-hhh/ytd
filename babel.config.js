module.exports = api => {
	const presets = ['module:metro-react-native-babel-preset'];
	const plugins = [
		[
			'transform-inline-environment-variables',
			{
				include: ['BACKEND_URL_ROOT']
			}
		]
	];
	api.cache.invalidate(() => process.env.BACKEND_URL_ROOT);
	return { presets, plugins };
};
