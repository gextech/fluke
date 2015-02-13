'use strict';

/* global Promise, XMLHttpRequest, XDomainRequest */

var cbid = 0,
    cbprefix = '_cb',
    docHead = document.documentElement,
    isIE10 = navigator.userAgent.indexOf('MSIE 10.0') > -1;

function parseHeaders(headers) {
  var map = {};

  headers.split('\n').forEach(function(line) {
    if (line.indexOf(':') > -1) {
      var _ = line.split(':'),
          key = _[0].trim(),
          value = _[1].trim();

      key = key.toLowerCase();

      if (typeof map[key] === 'undefined') {
        map[key] = value;
      } else if (Array.isArray(map[key])) {
        map[key].push(value);
      } else {
        map[key] = [map[key], value];
      }
    }
  });

  return map;
}

function responseWrapper(req) {
  var headers = parseHeaders(req.getAllResponseHeaders());

  function parse() {
    return JSON.parse(req.responseText);
  }

  return {
    getJSON: parse,
    headers: headers,
    statusCode: req.status,
    responseText: req.responseText
  };
}

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

function doRequest(params) {
  var allowedTypes = {
    '*': 'text/javascript, text/html, application/xml, text/xml, */*',
    'xml': 'application/xml, text/xml',
    'html': 'text/html',
    'text': 'text/plain',
    'json': 'application/json, text/javascript'
  };

  params.headers.Accept = params.headers.Accept || allowedTypes[params.dataType] || allowedTypes['*'];

  if (typeof params.crossDomain === 'undefined') {
    var matches = params.url.match(/^([\w-]+:)?\/\/([^\/]+)/);

    params.crossDomain = matches[2].indexOf(document.location.host) === -1;
  }

  if (!params.crossDomain) {
    params.headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  var req;

  if (params.crossDomain && typeof XDomainRequest !== 'undefined') {
    req = new XDomainRequest();
  } else {
    req = new XMLHttpRequest();
  }

  return function(done, err) {
    req.addEventListener('load', function() {
      if (typeof params.load === 'function') {
        params.load(req);
      }

      if (req.readyState === 4) {
        if (req.status >= 200 && req.status < 400) {
          try {
            if (typeof params.after === 'function') {
              params.after(req);
            }

            done(responseWrapper(req));
          } catch (e) {
            err(e);
          }
        } else {
          err();
        }
      }
    });

    req.addEventListener('error', function() {
      if (typeof params.error === 'function') {
        params.error(req);
      }

      err();
    });

    return req;
  };
}

function doJSONP(params) {
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script'),
        data = buildQuery(params.data || {}) || '';

    params.url += (params.url.indexOf('?') > -1 ? '&' : '?') + data;
    params.url += data ? '&' : '';

    script.async = true;
    script.type = 'text/javascript';
    script.src = params.url + 'callback=' + cbprefix + cbid + '&_cid=' + cbid;

    if (!isIE10) {
      script.htmlFor = script.id = 'jsonp_' + cbid;
    }

    function removeCB() {
      if (typeof window[cbprefix + cbid] === 'function') {
        delete window[cbprefix + cbid];
      }

      docHead.removeChild(script);
    }

    if (typeof params.before === 'function') {
      params.before();
    }

    window[cbprefix + cbid] = function(data) {
      if (typeof params.after === 'function') {
        params.after();
      }

      removeCB();
      resolve(data);
    };

    setTimeout(function() {
      if (typeof window[cbprefix + cbid] === 'function') {
        reject('Request Timeout');
        setTimeout(removeCB, 9600);
        window[cbprefix + cbid] = removeCB;
      }
    }, params.timeout || 3600);

    docHead.appendChild(script);

    cbid += 1;
  });
}

function doXHR(params) {
  return new Promise(function(resolve, reject) {
    var xhr = doRequest(params)(resolve, reject),
        data = buildQuery(params.data || {}),
        method = params.type || 'GET',
        headers = params.headers || {};

    if (params.withCredentials && typeof xhr.withCredentials !== 'undefined') {
      xhr.withCredentials = Boolean(params.withCredentials);
    }

    if (method === 'GET' && data) {
      params.url += (params.url.indexOf('?') > -1 ? '&' : '?') + data;
      data = null;
    }

    xhr.open(method.toUpperCase(), params.url, true);

    if (typeof params.before === 'function') {
      params.before(xhr);
    }

    if (typeof xhr.setRequestHeader === 'function') {
      for (var key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    xhr.send(data);
    xhr = null;
  });
}

var xhr = module.exports = function(url, data, params) {
  if (typeof url === 'object') {
    params = url;
    url = null;
  }

  params = typeof params === 'object' ? params : {};
  params.url = params.url || (typeof url === 'string' ? url : '');
  params.data = params.data || (typeof data === 'object' ? data : undefined);
  params.headers = params.headers || {};

  if (params.dataType === 'jsonp') {
    return doJSONP(params);
  }

  return doXHR(params);
};

function bind(overrides) {
  return function(url, data, params) {
    params = params || {};

    for (var key in overrides) {
      params[key] = overrides[key];
    }

    return xhr(url, data, params);
  };
}

xhr.get = bind({ type: 'GET' });
xhr.put = bind({ type: 'PUT' });
xhr.post = bind({ type: 'POST' });
xhr.patch = bind({ type: 'PATCH' });
xhr['delete'] = bind({ type: 'DELETE' });
