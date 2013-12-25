/*
 * (C) Copyright 2013 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */


module.exports = function(grunt)
{
  var DIST_DIR = 'dist';

  // Project configuration.
  grunt.initConfig(
  {
    pkg: grunt.file.readJSON('package.json'),

    // Plugins configuration
    clean:
    {
      generated_code: [DIST_DIR, 'src'],

      generated_doc: '<%= jsdoc.all.dest %>',

      browserify_sourcemap:
      [
        '<%= browserify.standalone_sourcemap.dest %>',
        '<%= browserify.require_sourcemap.dest %>'
      ]
    },

    jsdoc:
    {
      all:
      {
        src: ['README.md', 'lib/*.js', 'test/*.js'], 
        dest: 'doc/jsdoc'
      }
    },

    nodeunit:
    {
      all: ['test/**/*.js']
    },

    browserify:
    {
      require:
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>_require.js'
      },

      standalone:
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>.js',

        options:
        {
          standalone: '<%= pkg.name %>'
        }
      },

      require_sourcemap:
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>_require_sourcemap.js',

        options:
        {
          debug: true
        }
      },

      standalone_sourcemap:
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>_sourcemap.js',

        options:
        {
          debug: true,
          standalone: '<%= pkg.name %>'
        }
      }
    },

    minifyify:
    {
      options:
      {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },

      standalone:
      {
        src:  '<%= browserify.standalone_sourcemap.dest %>',
        dest: DIST_DIR+'/<%= pkg.name %>.min.js',
        map:  DIST_DIR+'/<%= pkg.name %>.map'
      },

      require:
      {
        src:  '<%= browserify.require_sourcemap.dest %>',
        dest: DIST_DIR+'/<%= pkg.name %>_require.min.js',
        map:  DIST_DIR+'/<%= pkg.name %>.map'
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Minifyify task
  var minifyify = require('minifyify');
  var fs = require('fs');
  var path = require('path');

  grunt.registerMultiTask('minifyify',
      'Minify your browserify bundle without losing the sourcemap', function()
  {
    var namespace = this.name+'.'+this.target;

    // Fetch configuration data
    this.requiresConfig(namespace+'.src', namespace+'.dest', namespace+'.map');

    var src  = grunt.config(namespace+'.src');
    var dest = grunt.config(namespace+'.dest');
    var map  = grunt.config(namespace+'.map');

    // Options for minifyify & UglifyJS
    var options = this.options(
    {
      map: path.relative(path.dirname(dest), map),

      compressPaths: function(p)
      {
        return path.relative(path.dirname(map), p);
      }
    });

    // Run minifyify
    var done = this.async();

    var readStream  = fs.createReadStream(src);
    var writeStream = fs.createWriteStream(dest);

    readStream.on('open', function()
    {
      grunt.log.writeln(JSON.stringify(options));
      readStream.pipe(minifyify(options, function(error, src, srcMap)
      {
        fs.writeFileSync(map, srcMap);
      })).pipe(writeStream);
    });

    readStream.on('error', function(error)
    {
      done(error);
    });

    writeStream.on('finish', function()
    {
      done();
    });
  });

  // Alias tasks
  grunt.registerTask('default', ['clean', 'jsdoc', 'browserify', 'minifyify', 'clean:browserify_sourcemap']);
//  grunt.registerTask('default', ['nodeunit', 'clean', 'jsdoc', 'browserify', 'minifyify', 'clean:browserify_sourcemap']);
};