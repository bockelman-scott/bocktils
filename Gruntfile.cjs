module.exports = function( grunt )
{
    grunt.initConfig( {
                          pkg: grunt.file.readJSON( "package.json" ),
                          uglify: {
                              options: {

                              },
                              build: {
                                  src: "**/utils/*.js",
                                  dest: "build/*.min.js"
                              }
                          }
                      } );

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks( "grunt-contrib-uglify" );

    // Default task(s).
    grunt.registerTask( "default", ["uglify"] );
};
