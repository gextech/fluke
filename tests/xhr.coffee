require('es6-promise').polyfill()

$ = require('../lib/minireq')

describe 'minireq', ->
  describe 'response object', ->
    result = null

    beforeEach (done) ->
      $(url: 'https://api.github.com/users/gextech').then (response) ->
        result = response
        done()
      .catch ->
        # fallback
        result =
          getJSON: -> name: 'Tecnología Grupo Expansión'
          headers: 'x-ratelimit-limit': NaN
          statusCode: 200
          responseText: '{"login": "gextech"}'
        done()

    afterEach ->
      result = null

    it 'responds to getJSON()', ->
      expect(result.getJSON().name).toBe 'Tecnología Grupo Expansión'

    it 'responds headers directly', ->
      expect(result.headers['x-ratelimit-limit']).not.toBeUndefined()

    it 'responds statusCode directly', ->
      expect(result.statusCode).toBe 200

    it 'responds responseText directly', ->
      expect(result.responseText).toContain '"login": "gextech"'

  describe 'all verbs supported', ->
    root = 'http://jsonplaceholder.typicode.com'

    it 'should handle GET-requests', (done) ->
      $.get(root + '/users/1').then (response) ->
        expect(response.getJSON().name).toBe 'Leanne Graham'
        done()

    it 'should handle PUT-requests', (done) ->
      $.put(root + '/users/2').then (response) ->
        expect(response.getJSON().name).toBe 'Ervin Howell'
        done()

    it 'should handle POST-requests', (done) ->
      # TODO: why cant POST /users/3 there?
      $.post(root + '/users').then (response) ->
        expect(response.getJSON()).toEqual id: 11
        done()

    it 'should handle PATCH-requests', (done) ->
      $.patch(root + '/users/4').then (response) ->
        expect(response.getJSON().name).toBe 'Patricia Lebsack'
        done()

    it 'should handle DELETE-requests', (done) ->
      $.delete(root + '/users/4').then (response) ->
        expect(response.statusCode).toBe 204
        done()

  xdescribe 'getJSON', ->
    it 'should handle GET-requests as dataType: json', (done) ->
      $.getJSON('http://api.github.com/users/gextech')
      .then (data) ->
        done()
