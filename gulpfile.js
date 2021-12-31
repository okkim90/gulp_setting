

var gulp = require('gulp'),
 sass = require('gulp-sass')(require('sass')),
 sourcemaps = require('gulp-sourcemaps'),
 nodemon = require('gulp-nodemon'),
 browserSync = require('browser-sync'),
 fileinclude = require('gulp-file-include'),
 sassGlob = require('gulp-sass-glob'),
 spritesmith = require('gulp.spritesmith-multi'),
 //spritesmith = require('gulp.spritesmith'),
 del = require('del'),
 runSequence = require('run-sequence'),
 merge = require('merge-stream'),
 concat = require('gulp-concat'),
 uglify = require('gulp-uglify'),
 rename = require('gulp-rename'),
 autoprefixer = require('gulp-autoprefixer'),
 fs = require('fs'),
 path = require('path'),
 imagemin = require('gulp-imagemin'),
 prettyHtml = require('gulp-pretty-html'),
 removeEmptyLines = require('gulp-remove-empty-lines'),
 log = require('fancy-log');
// 소스 파일 경로
var PATH = {
    HTML: './workspace/html'
    , ASSETS: {
        FONTS: './workspace/assets/fonts' ,
        IMAGES: './workspace/assets/images' ,
        STYLE: './workspace/assets/style' ,
        SCRIPT: './workspace/assets/js',
        SPRITE: './workspace/assets/sprite',
        LIB: './workspace/assets/lib'
    }
},
// 산출물 경로
DEST_PATH = {
    HTML: './dist'
    , ASSETS: {
        FONTS: './dist/assets/fonts' ,
        IMAGES: './dist/assets/images' ,
        STYLE: './dist/assets/style' ,
        SCRIPT: './dist/assets/js',
        SPRITE: './dist/assets/sprite',
        LIB: './dist/assets/lib'
    }
};


gulp.task('prettify', function () {
    return new Promise( resolve => {
        gulp.src(DEST_PATH.HTML + '/*.html')
        .pipe(prettyHtml())
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(DEST_PATH.HTML))
        .pipe( browserSync.reload({stream: true}) );
        resolve();
    });
});




// Clean Sprite
gulp.task('clean-sprite', function() {
	return del(DEST_PATH.ASSETS.IMAGES + "/sprite");
});


gulp.task('clean', () => {
    return new Promise( resolve => {
        del.sync(DEST_PATH.HTML);
        resolve();
    });
});




// 스프라이트
gulp.task('auto-sprite', () => {
    var opts = {
        spritesmith: function (options, sprite, icons){
            options.imgPath =  `../images/sprite/${options.imgName}`;
            options.cssName = `${sprite}-sprite.scss`;
            options.cssTemplate = null;
            options.cssSpritesheetName = sprite;
            options.padding = 10;
            options.cssVarMap =  function(sp) {
                sp.name = `${sprite}-${sp.name}`;
            };
            return options;
        }
    };

    var spriteData = gulp.src('./workspace/assets/sprite/**/*.*')
        .pipe(spritesmith(opts))
        .on('error', function (err) {
            console.log(err)
        });

    var imgStream = spriteData.img.pipe(gulp.dest('./dist/assets/images/sprite'));
    var cssStream = spriteData.css.pipe(gulp.dest('./workspace/assets/style/sprite'));

    return merge(imgStream, cssStream);
});


gulp.task( 'sass', () => {
    return new Promise( resolve => {
        var options = {
            outputStyle: "expanded" // nested, expanded, compact, compressed
            , indentType: "space" // space, tab
            , indentWidth: 4 //
            , precision: 8
            , sourceComments: true // 코멘트 제거 여부
        };
        gulp.src( PATH.ASSETS.STYLE + '/*.scss')
            .pipe(sassGlob())
            .pipe( sourcemaps.init() )
            .pipe( sass(options) )
            //.pipe(cssImport())
            .pipe(autoprefixer({ // autoprefixer 추가
                Browserslist: ['chrome > 0', 'ie > 0', 'firefox > 0']
            }))
            //.pipe( sourcemaps.write() )
            .pipe( gulp.dest( DEST_PATH.ASSETS.STYLE ) )
            .pipe( browserSync.reload({stream: true}) );

        resolve();
    });
});

gulp.task('html',() => {
    return new Promise(resolve => {
        gulp.src( PATH.HTML + '/*.html' )
            .pipe( gulp.dest( DEST_PATH.HTML ) )
            .pipe( browserSync.reload({stream: true}) );
        resolve();
    })
});


gulp.task('fileinclude', () => {

    return new Promise( resolve => {

        gulp.src([
                PATH.HTML + '/*.html', // ★★★★ 불러올 파일의 위치
                //"!" + PATH.HTML + '/include/*.html' // ★★★★ 읽지 않고 패스할 파일의 위치
            ])
            .pipe(fileinclude({
                prefix: '@@',
                basepath: '@file'
            }))
            .pipe(gulp.dest(DEST_PATH.HTML)) // ★★★★ 변환한 파일의 저장 위치 지정 });
            .pipe( browserSync.reload({stream: true}) );
        resolve();
    });
});

gulp.task( 'nodemon:start', () => {
    return new Promise( resolve => {
        nodemon({
            script: 'app.js' ,
            watch: DEST_PATH.HTML
        });
        resolve();
    });
});

gulp.task( 'script:concat', () => {
    return new Promise( resolve => {
        gulp.src( PATH.ASSETS.SCRIPT + '/*.js' )
        // src 경로에 있는 모든 js 파일을 common.js 라는 이름의 파일로 합친다.
        .pipe( concat('common.js') )
        .pipe( gulp.dest( DEST_PATH.ASSETS.SCRIPT ) )
        .pipe( uglify({
            mangle: true
        }))
        .pipe(rename('common.min.js'))
        .pipe(gulp.dest(DEST_PATH.ASSETS.SCRIPT))
        .pipe( browserSync.reload({stream: true}) );

        resolve();
    })
});


gulp.task( 'imagemin', () => {
    return new Promise( resolve => {
        gulp.src( PATH.ASSETS.IMAGES + '/*.*' )
            .pipe( imagemin([
                imagemin.gifsicle({interlaced: false}),
                imagemin.mozjpeg({progressive: true}),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ]))
            .pipe( gulp.dest( DEST_PATH.ASSETS.IMAGES ) )
            .pipe( browserSync.reload({stream: true}) );
        resolve();
    });
});




gulp.task('watch', () => {
    return new Promise( resolve => {
        gulp.watch(PATH.HTML + "/**/*.html", gulp.series(['fileinclude']));
        //gulp.watch(DEST_PATH.HTML + "/*.html", gulp.series(['prettify']));
        gulp.watch(PATH.ASSETS.STYLE + "/**/*.scss", gulp.series(['sass']));
        gulp.watch(PATH.ASSETS.SPRITE + "/**/*.*", gulp.series(['sprite-and-sass']));
        gulp.watch(PATH.ASSETS.IMAGES + "/**/*.*", gulp.series(['imagemin']));
        gulp.watch(PATH.ASSETS.SCRIPT + "/**/*.js", gulp.series(['script:concat']));
        resolve();
    });
});

gulp.task('browserSync', () => {
    return new Promise( resolve => {
        browserSync.init( null, {
            proxy: 'http://localhost:8005'
            , port: 8006
        });


        resolve();
    });
});

gulp.task( 'library', () => {
    return new Promise( resolve => {
        gulp.src( PATH.ASSETS.LIB + '/*.*')
            .pipe( gulp.dest( DEST_PATH.ASSETS.LIB ));
        resolve();
    });
});


gulp.task( 'fonts', () => {
    return new Promise( resolve => {
        gulp.src( PATH.ASSETS.FONTS + '/*.*')
            .pipe( gulp.dest( DEST_PATH.ASSETS.FONTS ));
        resolve();
    });
});



gulp.task('getFiles',() => {
    return new Promise( resolve => {
        var dir = PATH.HTML;
        const dirents = fs.readdirSync(dir, { withFileTypes: true });
        const filesNames = dirents
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);

        log(filesNames);
        fs.readdir(dir, function(error, filelist){
           // log("file-list", filelist);
        });
        resolve();
    });
});






// 스프라이트 and SASS
var sassAndSprite = gulp.series([
    //'clean-sprite',
    'auto-sprite',
    'sass'
]);
gulp.task('sprite-and-sass', sassAndSprite);







// all series
var allSeries = gulp.series([
    'clean',
    'sprite-and-sass',
    'fileinclude',

    'script:concat',
    'imagemin',
    'library',
    'fonts',
    'nodemon:start',
    'browserSync' ,
    'watch',
    'prettify',
    'getFiles'

]);
gulp.task( 'default', allSeries);

