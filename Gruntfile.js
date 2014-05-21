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

      generated_doc: '<%= jsdoc.all.dest %>'
    },

    jsdoc:
    {
      all:
      {
        src: ['README.md', 'lib/*.js', 'test/*.js'], 
        dest: 'doc/jsdoc'
      }
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
          bundleOptions: {
            standalone: '<%= pkg.name %>'
          }
        }
      },

      require_sourcemap:
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>_require.min.js',

        options:
        {
          debug: true,
          plugin: [
            ['minifyify',
             {
               compressPath: DIST_DIR,
               map: DIST_DIR+'/<%= pkg.name %>.map'
             }]
          ]
        }
      },

      standalone_sourcemap:
      {
        src:  '<%= pkg.main %>',
        dest: DIST_DIR+'/<%= pkg.name %>.min.js',

        options:
        {
          debug: true,
          bundleOptions: {
            standalone: '<%= pkg.name %>'
          },
          plugin: [
            ['minifyify',
             {
               compressPath: DIST_DIR,
               map: DIST_DIR+'/<%= pkg.name %>.map'
             }]
          ]
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Alias tasks
  grunt.registerTask('default', ['clean', 'browserify']);
//  grunt.registerTask('default', ['clean', 'jsdoc', 'browserify']);
};
