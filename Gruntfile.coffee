module.exports = (grunt) ->
  grunt.registerTask 'express', ->
    port = if typeof grunt.cli.options.port is 'string'
      +grunt.cli.options.port
    else
      8081

    require('./tests/fixtures/stub-server').listen(port)

  grunt.loadNpmTasks 'grunt-parts'
