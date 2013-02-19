module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    },
    shell: {
      // Generate documentation
      makeDocs: {
        command: 'ls && doxx --source . --ignore "public,static,views,templates,node_modules,grunt,config" --target public/docs'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        es5: true,
        strict: false
      },
      globals: {
        jQuery: true
      },
      uses_defaults: [ '*.js', 'lib/**/*.js', 'test/**/*.js' ]
    } 
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-shell');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'shell']);

};
