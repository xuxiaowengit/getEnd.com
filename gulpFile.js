const gulp=require('gulp');
const uglify=require('gulp-uglify');
const cleanCSS=require('gulp-clean-css');
const htmlmin=require('gulp-htmlmin');
// const concat=require('gulp-concat');
const sourcemaps=require('gulp-sourcemaps');
const babel=require('gulp-babel');
const rimraf=require('rimraf');
const terser=require('gulp-terser');


// / 压缩 JavaScript

function scripts() {
	return gulp.src(['src/**/*.js','!src/node_modules/**']) // 确保路径正确
		.pipe(sourcemaps.init())
		.pipe(uglify({
			compress: false, // 关闭所有压缩
			mangle: false,   // 不混淆变量名
			output: {
				comments: false,  // 删除所有注释
				beautify: false,  // 不美化输出
			}
		}))
		.pipe(sourcemaps.write('.'))  // 可以开启 sourcemaps
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





function copyPackageAndNodeModules() {
	// 复制 package.json、package-lock.json 等文件到 dist 保留结构
	gulp.src([  //默认拷贝默认src目录下的文件，
		'package.json',
		'package-lock.json',
		'json/**/*',
		'node_modules/**/*',
		'!**/System Volume Information/**',
		'!node_modules/codepage/cptable.js',
		'!node_modules/es5-ext/_postinstall.js'
	],{ base: '.' }) // 保留文件夹结构
		.pipe(gulp.dest('dist/'));

	gulp.src([  //非src目录的上级目录下的文件
		'./node_modules/**/*', // 排除 src 下的 node_modules
		'./package.json',
		'./package-lock.json',
	],{ base: '.' }) // 保留文件夹结构
		.pipe(gulp.dest('dist/'));


	gulp.src('src/data/*')
		.pipe(gulp.dest('dist/data'));

	return gulp.src('src/datain/*')
		.pipe(gulp.dest('dist/datain'));
}






// 合并所有任务为一个
const build=gulp.series(
	// clean, // 清理输出目录
	gulp.parallel(
		scripts, // 压缩 JavaScript
		styles, // 压缩 CSS
		pages, // 压缩 HTML
		copyPackageAndNodeModules,// 复制 package.json 和 node_modules,
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
