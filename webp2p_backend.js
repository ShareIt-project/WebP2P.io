// Based on code from https://github.com/jaredhanson/jsonrpc-postmessage

var methods = {}

function expose(name, service)
{
  if(!service && typeof name == 'object')
  {
    service = name;
    name = null;
  }

  if(typeof service == 'function')
    methods[name] = service;

  else if(typeof service == 'object')
  {
    var module = name ? name + '.' : '';
    for(var method in service)
      if(typeof service[method] === 'function')
        methods[module + method] = service[method];
  }
}

expose(new webp2p.Webp2pLocal())


self.onmessage = function(event)
{
  function result(err, res)
  {
    // requests without an id are notifications, to which responses are
    // supressed
    if(event.id !== null)
    {
      var response = {id: event.id}

      if(err)
        response.error = err.message

      else
        response.result = res || null

      self.send(response)
    }
  }

  var method = methods[event.method];
  if(typeof method == 'function')
  {
    var params = event.args || [];
    // push result function as the last argument
    params.push(result);

    // invoke the method
    try
    {
      method.apply(webp2p, params);
    }
    catch(err)
    {
      result(err);
    }
  }
  else
    result(new Error('Method Not Found'));
};