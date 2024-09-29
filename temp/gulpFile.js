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
	return gulp.src(['/**/*.js','!src/node_modules/**']) // 确保路径正确
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
		.pipe(gulp.dest('./dist/'));
}

// 压缩 CSS
function styles() {
	return gulp.src('css/**/*.css') // 确保路径正确
		.pipe(sourcemaps.init())
		.pipe(cleanCSS())
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dist/css/'));
}

// 压缩 HTML
function pages() {
	return gulp.src('/*.html') // 确保路径正确
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest('./dist/'));
}



// function copyPackageAndNodeModules() {
// 	return gulp.src([
// 		'package.json',
// 		'package-lock.json',
// 		'json/**/*',
// 		'src/data/**/*',
// 		'src/datain/**/*',
// 		'node_modules/**/*',
// 		'src/node_modules/**/*',
// 		'!**/System Volume Information/**', // 确保排除系统文件夹
// 		'!node_modules/codepage/cptable.js', // 忽略大文件
// 		'!node_modules/es5-ext/_postinstall.js' // 忽略路径
// 	],{ base: '.' }) // 保留文件夹结构
// 		.pipe(gulp.dest('dist/'));
// }


// const gulp=require('gulp');

function copyPackageAndNodeModules() {
	// 复制 package.json、package-lock.json 等文件到 dist 保留结构
	gulp.src([  //默认拷贝默认src目录下的文件，
		'package.json',
		'package-lock.json',
		'json/**/*',
		'node_modules/**/*',
		'!**/System Volume Information/**',
		'!System Volume Information/**',
		'!./System Volume Information/**',
		'!../System Volume Information/**',
		'!node_modules/codepage/cptable.js',
		'!node_modules/es5-ext/_postinstall.js'
	],{ base: '.' }) // 保留文件夹结构
		.pipe(gulp.dest('./dist/'));

	gulp.src([  //非src目录的上级目录下的文件
		'../node_modules/**/*', // 排除 src 下的 node_modules
		'../package.json',
		'../package-lock.json',
	],{ base: '.' }) // 保留文件夹结构
		.pipe(gulp.dest('./dist/'));
	  
	// 复制指定的 src 目录下的文件和子目录，不生成 src 文件夹
	return gulp.src([
		'data/**/*',
		'datain/**/*'
	])
		.pipe(gulp.dest(file => {
			// 确保保留第一层目录
			return `./dist/${file.relative.split('/')[1]}`; // 将内容放入对应的目录
		}));
}

// exports.default=copyPackageAndNodeModules;


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
