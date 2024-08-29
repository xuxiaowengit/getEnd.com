const gulp=require('gulp');
const uglify=require('gulp-uglify');
const cleanCSS=require('gulp-clean-css');
const htmlmin=require('gulp-htmlmin');
const concat=require('gulp-concat');
const sourcemaps=require('gulp-sourcemaps');
const babel=require('gulp-babel');
const rimraf=require('rimraf');



// 压缩 JavaScript
function scripts() {
	return gulp.src('src/**/*.js') // 确保路径正确
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(uglify())
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/'));
}

// 压缩 CSS
function styles() {
	return gulp.src('src/css/**/*.css') // 确保路径正确
		.pipe(sourcemaps.init())
		.pipe(cleanCSS())
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/css'));
}

// 压缩 HTML
function pages() {
	return gulp.src('src/*.html') // 确保路径正确
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest('dist'));
}

// 复制 package.json 和 node_modules
function copyPackageAndNodeModules() {
	// 复制 package.json 文件
	gulp.src('package.json')
		.pipe(gulp.dest('dist'));

	// 复制 package-lock.json 文件
	gulp.src('package-lock.json')
		.pipe(gulp.dest('dist'));
	
	// 复制 json 文件夹
	gulp.src('src/json/**/*')
		.pipe(gulp.dest('dist/json'));
	
	// 复制 node_modules 目录
	return gulp.src('node_modules/**/*')
		.pipe(gulp.dest('dist/node_modules'));
	
	
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
}

// 导出任务
exports.build=build;
exports.watch=gulp.series(build,watchFiles); // 同时执行 build 和监控任务
