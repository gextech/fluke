var cbid = 0,
    cbprefix = '_cb' + (new Date()).getTime().toString(16).substr(0, 7),
    isClient = 'undefined' !== typeof document && 'undefined' !== typeof navigator,
    docHead = isClient ? document.getElementsByTagName('head')[0] || document.documentElement : false,
    isIE10 = isClient ? navigator.userAgent.indexOf('MSIE 10.0') > -1 : false;

if ('function' !== typeof Promise) {
  throw new Error('Missing Promise object?');
}

if ('function' !== typeof XMLHttpRequest) {
  throw new Error('Missing XMLHttpRequest object?');
}

function mergeArguments() {
  var target = {};

  for (var index in arguments) {
    var source = arguments[index];

    for (var prop in source) {
      var value = source[prop];

      target[prop] = 'undefined' !== value && null !== value ? value : target[prop];
    }
  }

  return target;
}

function queryString(data) {
  var params = [],
      escape = encodeURIComponent;

  function reduce(key, val) {
    var tmp = [];

    if ('object' === typeof val) {
      for (var k in val) {
        var v = val[k];

        if (v !== null) {
          tmp = tmp.concat(reduce(key + '[' + k + ']', v));
        }
      }
    } else {
      tmp.push(escape(key) + '=' + ('boolean' === typeof val ? +val : escape(val)));
    }

    return tmp;
  }

  for (var key in data) {
    var query = reduce(key, data[key]);

    if (query && query.length) {
      params = params.concat(query);
    }
  }

  return params.join('&').replace(/%20/g, '+');
}

function makeRequest(params) {
  if (!params.headers) {
    params.headers = {};
  }

  var allowedTypes = {
    '*': 'text/javascript, text/html, application/xml, text/xml, */*',
    'xml': 'application/xml, text/xml',
    'html': 'text/html',
    'text': 'text/plain',
    'json': 'application/json, text/javascript'
  };

  /* jshint sub:true */
  params.headers['Accept'] = params.headers['Accept'] || allowedTypes[params.dataType] || allowedTypes['*'];

  if (isClient) {
    if ('undefined' === typeof params.crossDomain) {
      var matches = params.url.match(/^([\w-]+:)?\/\/([^\/]+)/);

      params.crossDomain = matches[2].indexOf(window.location.host) === -1;
    }

    if (!params.crossDomain) {
      params.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
  }

  var req;

  if (params.crossDomain && 'undefined' !== typeof XDomainRequest) {
    req = getXHR(new XDomainRequest(), params);
  } else {
    req = getXHR(new XMLHttpRequest(), params);
  }

  return req;
}

function getXHR(req, params) {
  return function(done, err) {
    function onLoad() {
      if ('function' === typeof params.after) {
        params.after(req);
      }

      if (4 === req.readyState) {
        if (req.status >= 200 && req.status < 400) {
          try {
            if ('json' === params.dataType) {
              done(JSON.parse(req.responseText));
            } else {
              done(req.responseText);
            }
          } catch (e) {
            err(e);
          }
        } else {
          err();
        }
      }
    }

    function onError() {
      if ('function' === typeof params.error) {
        params.error(req);
      }

      err();
    }

    if (!req.addEventListener) {
      // rhino or ol' browsers?
      req.onload = onLoad;
      req.onerror = onError;
      req.onprogress = function() {};
      req.onreadystatechange = onLoad;
    } else {
      req.addEventListener('load', onLoad);
      req.addEventListener('error', onError);
    }

    return req;
  };
}

function doJSONP(params) {
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script'),
        data = queryString(params.data || {}) || null;

    params.url += (params.url.indexOf('?') > -1 ? '&' : '?') + data;
    params.url += data ? '&' : '';

    script.async = true;
    script.type = 'text/javascript';
    script.src = params.url + 'callback=' + cbprefix + cbid + '&_cid=' + cbid;

    if (!isIE10) {
      script.htmlFor = script.id = 'jsonp_' + cbid;
    }

    function removeCB() {
      if ('function' === typeof window[cbprefix + cbid]) {
        delete window[cbprefix + cbid];
      };

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    if ('function' === typeof params.before) {
      params.before();
    }

    window[cbprefix + cbid] = function(data) {
      if ('function' === typeof params.after) {
        params.after();
      }

      removeCB();
      resolve(data);
    };

    setTimeout(function() {
      if ('function' === typeof window[cbprefix + cbid]) {
        reject('Request Timeout');
        setTimeout(removeCB, 9600);
        window[cbprefix + cbid] = removeCB;
      };
    }, params.timeout || 3600);

    docHead.appendChild(script);

    cbid += 1;
  });
}

function doXHR(params) {
  return new Promise(function(resolve, reject) {
    var xhr = makeRequest(params)(resolve, reject),
        data = queryString(params.data || {}) || null,
        method = (params.type || 'get').toUpperCase(),
        headers = params.headers || {};

    if (params.withCredentials && 'undefined' !== typeof xhr.withCredentials) {
      xhr.withCredentials = Boolean(params.withCredentials);
    }

    if ('GET' === method && data) {
      params.url += (params.url.indexOf('?') > -1 ? '&' : '?') + data;
      data = null;
    }

    xhr.open(method, params.url, params.sync || (!isClient && 'undefined' === typeof process) ? false : true);

    if ('function' === typeof params.before) {
      params.before(xhr);
    }

    if ('function' === typeof xhr.setRequestHeader) {
      for (var key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    xhr.send(data);
    xhr = null;
  });
}

module.exports = function(url, data, params) {
  if ('object' === typeof url) {
    params = url;
    url = null;
  }

  if (!params) {
    params = {};
  }

  var req = isClient && 'jsonp' === params.dataType ? doJSONP : doXHR;

  if ('string' !== typeof url) {
    return req(mergeArguments(url, data, params));
  } else {
    return req(mergeArguments({ url: url, data: data }, params));
  }
};
