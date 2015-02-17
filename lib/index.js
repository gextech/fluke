'use strict';

/* global fetch */

function buildQuery(data) {
  var params = [],
      escape = encodeURIComponent;

  function reduce(key, val) {
    var tmp = [];

    if (typeof val === 'object') {
      for (var k in val) {
        var v = val[k];

        if (v !== null) {
          tmp = tmp.concat(reduce(key + '[' + k + ']', v));
        }
      }
    } else {
      tmp.push(escape(key) + '=' + (typeof val === 'boolean' ? +val : escape(val)));
    }

    return tmp;
  }

  for (var key in data) {
    var q = reduce(key, data[key]);

    if (q && q.length) {
      params = params.concat(q);
    }
  }

  return params.join('&').replace(/%20/g, '+');
}

function fetchFrom(url, data, params) {
  if (typeof url === 'object') {
    params = url;
    url = null;
  }

  params = typeof params === 'object' ? params : {};
  params.headers = params.headers || {};

  data = params.data || data;
  url = params.url || url;

  var type = params.type;

  if (type === 'json') {
    params.headers.Accept = params.headers['Content-Type'] = 'application/json';
  }

  delete params.type;
  delete params.data;
  delete params.url;

  if (data) {
    if (params.method === 'GET') {
      url += (url.indexOf('?') > -1 ? '&' : '?') + buildQuery(data);
    } else if (type === 'json') {
      params.body = JSON.stringify(data);
    }
  }

  var req = fetch(url, params);

  if (type === 'json' && params.method === 'GET') {
    return req.then(function(response) {
      return response.json();
    });
  }

  return req;
}

function bind(overrides) {
  return function(url, data, params) {
    params = params || {};

    for (var key in overrides) {
      params[key] = overrides[key];
    }

    return fetchFrom(url, data, params);
  };
}

var proxy = module.exports = function() {
  return fetch.apply(null, arguments);
};

proxy.get = bind({ method: 'GET' });
proxy.put = bind({ method: 'PUT' });
proxy.post = bind({ method: 'POST' });
proxy.patch = bind({ method: 'PATCH' });
proxy['delete'] = bind({ method: 'DELETE' });

proxy.getJSON = bind({ method: 'GET', type: 'json' });
