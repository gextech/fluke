require('es6-promise').polyfill()
require('whatwg-fetch')

$ = require('../lib')

describe 'fluke', ->
  describe 'response object', ->
    result = null

    beforeEach (done) ->
      $('https://api.github.com/users/gextech').then (response) ->
        result = response
        done()
      .catch ->
        # fallback
        result = {}
        done()

    afterEach ->
      result = null

    it 'responds to json() as Promise', (done) ->
      result.json().then (data) ->
        expect(data.name).toBe 'Tecnología Grupo Expansión'
        done()

    it 'responds to text() as Promise', (done) ->
      result.text().then (data) ->
        expect(data).toContain '"login": "gextech"'
        done()

    it 'responds to status as number', ->
      expect(result.status).toBe 200

  describe 'all verbs supported', ->
    root = 'http://jsonplaceholder.typicode.com'

    it 'should handle GET-requests', (done) ->
      $.get(root + '/users/1').then (response) ->
        response.json().then (data) ->
          expect(data.name).toBe 'Leanne Graham'
          done()

    it 'should handle PUT-requests', (done) ->
      $.put(root + '/users/2').then (response) ->
        response.json().then (data) ->
          expect(data.name).toBe 'Ervin Howell'
          done()

    it 'should handle POST-requests', (done) ->
      # TODO: why cant POST /users/3 there?
      $.post(root + '/users').then (response) ->
        response.json().then (data) ->
          expect(data).toEqual id: 11
          done()

    it 'should handle PATCH-requests', (done) ->
      $.patch(root + '/users/4').then (response) ->
        response.json().then (data) ->
          expect(data.name).toBe 'Patricia Lebsack'
          done()

    it 'should handle DELETE-requests', (done) ->
      $.delete(root + '/users/4').then (response) ->
        expect(response.status).toBe 204
        done()

  describe 'request data', ->
    root = 'http://headers.jsontest.com'

    describe 'using method GET', ->
      it 'should set query-params if missing', (done) ->
        $.get(root, x: ['y', 'z']).then (response) ->
          expect(decodeURIComponent(response.url)).toContain '?x[0]=y&x[1]=z'
          done()

      it 'should append query-params if present', (done) ->
        $.get(root + '?m=n', x: ['y', 'z']).then (response) ->
          expect(decodeURIComponent(response.url)).toContain '?m=n&x[0]=y&x[1]=z'
          done()

  describe 'getJSON', ->
    it 'should handle GET-requests as json()', (done) ->
      $.getJSON('https://api.github.com/users/pateketrueke')
      .then (data) ->
        expect(data.blog).toBe 'http://soypache.co'
        done()
