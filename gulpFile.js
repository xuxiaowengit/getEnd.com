const gulp=require('gulp');
const uglify=require('gulp-uglify');
const cleanCSS=require('gulp-clean-css');
const htmlmin=require('gulp-htmlmin');
const concat=require('gulp-concat');
const sourcemaps=require('gulp-sourcemaps');
const babel=require('gulp-babel');
const rimraf=require('rimraf');



// / 压缩 JavaScript
function scripts() {
	return gulp.src(['src/**/*.js','!src/node_modules/**']) // 确保路径正确
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/preset-env'],
			ignore: [
				// 'node_modules/codepage/cptable.js',  // 忽略这个大文件
				// 'src/node_modules/es5-ext/_postinstall.js' // 排除路径
			],
		}))
		.pipe(uglify({
			compress: {
				drop_console: true, // 删除 console 语句
				drop_debugger: true // 删除 debugger 语句
			},
			output: {
				comments: false // 删除所有注释
			}
		}))
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/'));
}

// 压缩 CSS
function styles() {
	return gulp.src('src/css/**/*.css') // 确保路径正确
		.pipe(sourcemaps.init())
		.pipe(cleanCSS())
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/css/'));
}

// 压缩 HTML
function pages() {
	return gulp.src('src/*.html') // 确保路径正确
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest('dist/'));
}

// // 复制 package.json 和 node_modules
// function copyPackageAndNodeModules() {
// 	// 复制 package.json 文件
// 	gulp.src('package.json')
// 		.pipe(gulp.dest('dist/'));

// 	// 复制 package-lock.json 文件
// 	gulp.src('package-lock.json')
// 		.pipe(gulp.dest('dist/'));
	
// 	// 复制 json 文件夹
// 	gulp.src('json/**/*')
// 		.pipe(gulp.dest('dist/json/'));
	
// 	// 复制 json 文件夹
// 	gulp.src('data/**/*')
// 		.pipe(gulp.dest('dist/data/'));
	
// 	// 复制 node_modules 目录
// 	// return gulp.src('node_modules/**/*')
// 	// 	.pipe( gulp.dest('dist/node_modules'));  // 输出路径;
	
// 	gulp.src(['node_modules/**/*','!C:/System Volume Information/**'])  // 假设你的源文件在 src 目录下
// 			.pipe(babel({
// 				presets: ['@babel/preset-env'],
// 				ignore: [
// 					'node_modules/codepage/cptable.js',  // 忽略这个大文件
// 					 'node_modules/es5-ext/_postinstall.js' // 排除路径
// 				],
// 				compact: true
// 			}))
// 		.pipe(gulp.dest('dist/node_modules/'));  // 输出路径
// 	// return null;
	
// 	return gulp.src([
// 		'/*.{md,lock}', // 从根目录开始匹配所有 .js, .json, .md 和 .lock 文件
// 		'!node_modules/**' // 排除 node_modules 文件夹
// 	],{ base: '.' }) // 保留文件夹结构
// 		.pipe(gulp.dest('dist/'));
// }


function copyPackageAndNodeModules() {
	return gulp.src([
		'package.json',
		'package-lock.json',
		'json/**/*',
		'data/**/*',
		'node_modules/**/*',
		'!**/System Volume Information/**', // 确保排除系统文件夹
		'!node_modules/codepage/cptable.js', // 忽略大文件
		'!node_modules/es5-ext/_postinstall.js' // 忽略路径
	],{ base: '.' }) // 保留文件夹结构
		.pipe(gulp.dest('dist/'));
}

// 合并所有任务为一个
const build=gulp.series(
	// clean, // 清理输出目录
	gulp.parallel(
		scripts, // 压缩 JavaScript
		styles, // 压缩 CSS
		pages, // 压缩 HTML
		copyPackageAndNodeModules // 复制 package.json 和 node_modules
	)
);

// 监控文件变化
function watchFiles() {
	gulp.watch('src/*.js',scripts);
	gulp.watch('src/css/**/*.css',styles);
	gulp.watch('src/*.html',pages);
	gulp.watch('node_modules/**/*.*',copyPackageAndNodeModules);  
}

// 导出任务
exports.build=build;
exports.watch=gulp.series(build,watchFiles); // 同时执行 build 和监控任务
