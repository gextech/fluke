module.exports = (grunt) ->
  grunt.initConfig
    express:
      test:
        options:
          server: 'tests/fixtures/stub-server'
          port: if typeof grunt.cli.options.port is 'string'
            +grunt.cli.options.port
          else
            8081

  grunt.loadNpmTasks 'grunt-express'
  grunt.loadNpmTasks 'grunt-parts'
