const path=require('path');
const HtmlWebpackPlugin=require('html-webpack-plugin');
const WorkboxWebpackPlugin=require('workbox-webpack-plugin');
const TerserPlugin=require('terser-webpack-plugin'); // 可选

const isProduction=process.env.NODE_ENV=='production';

const stylesHandler='style-loader';

const config={
	entry: './getHtml.js',
	output: {
		path: path.resolve(__dirname,'./'),
		filename: 'bundle.js', // 输出的文件名
	},
	devServer: {
		open: true,
		host: 'localhost',
	},
	plugins: [
		// 启用 HtmlWebpackPlugin 以生成 index.html 文件
		// new HtmlWebpackPlugin({
		//     template: 'index.html', // 如果有模板，指定模板文件
		// }),

		// 其他插件可以在此添加
	],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				loader: 'ts-loader',
				exclude: ['/node_modules/'],
			},
			{
				test: /\.css$/i,
				use: [stylesHandler,'css-loader','postcss-loader'],
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
				type: 'asset',
			},
		],
	},
	resolve: {
		extensions: ['.tsx','.ts','.jsx','.js','...'],
		fallback: {
			"path": require.resolve("path-browserify"),
			"util": require.resolve("util/"),
		},
	},
};

module.exports=() => {
	if(isProduction) {
		config.mode='production';

		// 配置 TerserPlugin 以去除多余的空格、换行和注释
		config.optimization={
			minimize: true,
			minimizer: [new TerserPlugin({
				terserOptions: {
					format: {
						comments: false, // 去除所有注释
					},
					compress: {
						// drop_console: true, // 去掉 console 语句
						// drop_debugger: true, // 去掉 debugger 语句
						passes: 2, // 压缩优化两次，提升压缩率
					},
					mangle: true, // 混淆变量名，进一步压缩代码
				},
				extractComments: false, // 不生成单独的 LICENSE.txt 文件
			})],
		};

		config.plugins.push(new WorkboxWebpackPlugin.GenerateSW());

	} else {
		config.mode='development';
	}
	return config;
};
