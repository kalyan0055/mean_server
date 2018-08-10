'use strict';

module.exports = function(grunt) {
	// Unified Watch Object
	var watchFiles = {
		//serverViews: ['app/views/**/*.*'],
		serverJS: ['gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js', 'lib/*.js'],
		//clientViews: ['public/modules/**/views/**/*.html'],
		//clientJS: ['public/dist/application.min.js'],
		//clientJS: ['public/js/*.js', 'public/modules/**/*.js'],
		//clientCSS: ['public/modules/**/*.css'],
		mochaTests: ['app/test/*.js']
	};

	 
	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			// serverViews: {
			// 	files: watchFiles.serverViews,
			// 	options: {
			// 		livereload: true
			// 	}
			// },
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			// clientViews: {
			// 	files: watchFiles.clientViews,
			// 	options: {
			// 		livereload: true
			// 	}
			// },
			// clientJS: {
			// 	files: watchFiles.clientJS,
			// 	tasks: ['jshint'],
			// 	options: {
			// 		livereload: true
			// 	}
			// },
			// clientCSS: {
			// 	files: watchFiles.clientCSS,
			// 	tasks: ['csslint'],
			// 	options: {
			// 		livereload: true
			// 	}
			// }
		},
		// jshint: {
		// 	all: {
		// 		src: watchFiles.clientJS.concat(watchFiles.serverJS),
		// 		options: {
		// 			jshintrc: true
		// 		}
		// 	}
		// },
		// csslint: {
		// 	options: {
		// 		csslintrc: '.csslintrc',
        //         'order-alphabetical': false
		// 	},
		// 	all: {
		// 		src: watchFiles.clientCSS
		// 	}
		// },
		uglify: {
			production: {
				options: {
					mangle: true,
					quoteStyle: 3
				},
				files: {
					'public/dist/application.min.js': 'public/dist/application.js'
				}
			}
		},
		// cssmin: {
		// 	combine: {
		// 		files: {
		// 			'public/dist/application.min.css': '<%= applicationCSSFiles %>'
		// 		}
		// 	}
		// },
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					nodeArgs: ['--inspect'],
					ext: 'js,html',
					watch: watchFiles.serverJS
				}
			},
			production: {
				script: 'server.js',
				options: {
					ext: 'js,html',
					watch:watchFiles.serverJS
				}
			}
		},
		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		ngAnnotate: {
			options: {
				singleQuotes: true
			},
			production: {
				files: {
					'public/dist/application.js': '<%= applicationJavaScriptFiles %>'
				}
			}
		},
		concurrent: {
			production: ['nodemon:production', 'watch'],
			default: ['nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true,
				limit: 10
			}
		},
		env: {
			test: {
				NODE_ENV: 'test'
			},
			secure: {
				NODE_ENV: 'secure'
			},
			production: {
				NODE_ENV: 'production'
			}
		},
		mochaTest: {
			src: watchFiles.mochaTests,
			options: {
				reporter: 'spec',
				require: 'server.js',
                timeout: 2500000
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		},
		express: {
			dev: {
				options: {
					script: 'server.js'
				}
			},
			production: {
				options: {
					script: 'server.js'
				}
			},
			test: {
				options: {
					script: 'server.js'
				}
			}
		},
		protractor: {
			options: {
				configFile: 'protractor.conf.js',
				noColor: false,
				webdriverManagerUpdate: true
			},
			e2e: {
				options: {
                    args: {
                    baseUrl: grunt.option('baseUrl') || 'http://localhost:3001/'
                    }
				}
			}
		}

	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);
	grunt.loadNpmTasks('grunt-protractor-coverage');
	grunt.loadNpmTasks('grunt-protractor-runner');
	grunt.loadNpmTasks('grunt-express-server');

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var init = require('./config/init')();
		var config = require('./config/config');

		grunt.config.set('applicationJavaScriptFiles', config.assets.js);
		grunt.config.set('applicationCSSFiles', config.assets.css);
	});

	// Default task(s).

	grunt.registerTask('install', 'install the backend and frontend dependencies', function() {
	 
		
		var async = require('async');
		var exec = require('child_process').exec;
		var done = this.async();

		var runCmd = function(item, callback) {
			process.stdout.write('running "' + item + '"...\n');
			var cmd = exec(item);
			cmd.stdout.on('data', function (data) {
				grunt.log.writeln(data);
			});
			cmd.stderr.on('data', function (data) {
				grunt.log.errorlns(data);
			});
			cmd.on('exit', function (code) {
				if (code !== 0) throw new Error(item + ' failed');
				grunt.log.writeln('done\n');
				callback();
			});
		};

		async.series({
				npm: function(callback){
					runCmd('sudo npm install --save', callback);
				},
				bower: function(callback){
					runCmd('sudo bower install --allow-root --save', callback);
				}
			},
			function(err, results) {
				if (err) done(false);
				done();
			});
	});
	grunt.registerTask('default', ['lint', 'concurrent:default']);

	// Debug task.
	grunt.registerTask('debug', ['lint', 'concurrent:debug']);

	// Secure task(s).
	grunt.registerTask('secure', ['env:secure', 'lint', 'concurrent:default']);

	// Secure task(s).
	grunt.registerTask('production', ['env:production', 'concurrent:production']);

	// Lint task(s).
	grunt.registerTask('lint', ['jshint', 'csslint']);

	// Build task(s).
	grunt.registerTask('build', ['lint', 'loadConfig', 'ngAnnotate', 'uglify', 'cssmin']);
	grunt.loadNpmTasks('grunt-bower-task');
	// Test task.
	grunt.registerTask('karmaTest', ['env:test', 'karma:unit']);
	grunt.registerTask('test', ['env:test', 'mochaTest']);


        // Run the project tests
    grunt.registerTask('test:e2e', ['env:test', 'lint', 'express:dev', 'protractor']);
};
