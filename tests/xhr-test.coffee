require('es6-promise').polyfill()
require('whatwg-fetch')

$ = require('../lib')

describe 'fluke', ->
  describe 'response object', ->
    result = null

    beforeEach (done) ->
      $('/fixtures/x?y=z').then (response) ->
        result = response
        done()

    afterEach ->
      result = null

    it 'responds to json() as Promise', (done) ->
      result.json().then (data) ->
        expect(data.query.y).toBe 'z'
        done()

    it 'responds to text() as Promise', (done) ->
      result.text().then (data) ->
        expect(data).toContain '"any":"x"'
        done()

    it 'responds to status as number', ->
      expect(result.status).toBe 200

  describe 'all verbs supported', ->
    ['get', 'put', 'post', 'patch', 'delete'].forEach (method) ->
      it "should handle #{method.toUpperCase()}-requests", (done) ->
        $[method](url: '/fixtures/rest', data: { method }, type: 'json').then done

  describe 'request data', ->
    describe 'using method GET', ->
      it 'should set query-params if missing', (done) ->
        $.get('/fixtures/data', x: ['y', 'z']).then (response) ->
          response.text().then (data) ->
            expect(data).toContain '"params":{"0":"","any":"data"}'
            done()

      it 'should append query-params if present', (done) ->
        $.get('/fixtures?m=n', x: ['y', 'z']).then (response) ->
          response.text().then (data) ->
            expect(data).toContain '"query":{"m":"n","x":["y","z"]}'
            done()

  describe 'getJSON', ->
    it 'should handle GET-requests as json()', (done) ->
      $.getJSON('/fixtures/k/v?a=b&c')
      .then (data) ->
        expect(data.params.any).toBe 'k'
        expect(data.query.a).toBe 'b'
        done()
