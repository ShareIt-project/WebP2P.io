/**
 * @fileoverview Magic dependency loading. Taken from JsJaC library.
 * @author Stefan Strigler steve@zeank.in-berlin.de (JsJaC)
 * @author Jesús Leganés Combarro "Piranna" piranna@gmail.com (webp2p)
 */

var webp2p =
{
  require: function(libraryName)
  {
    // inserting via DOM fails in Safari 2.0, so brute force approach
    document.write('<script type="text/javascript" src="'+libraryName+'"></script>');
  },

  load: function(regex, basepath, includes)
  {
    var scripts = document.getElementsByTagName("script");
    var path = './', i;
    for(i=0; i<scripts.length; i++)
    {
      var src = scripts.item(i).src
      if(src && src.match(regex))
      {
        path = src.replace(regex,basepath);
        break;
      }
    }

    for(i=0; i<includes.length; i++)
      this.require(path+includes[i]+'.js');
  },

  bind: function(fn, obj, optArg)
  {
    return function(arg)
    {
      return fn.apply(obj, [arg, optArg]);
    };
  }
};

webp2p.load(/webp2p\/index\.js$/, 'webp2p/',
            ['bitmap',
             'db',
             'peersManager',
             'utils',

             'hasher/index',

             'lib/zip.js/deflate',
             'lib/zip.js/inflate',
             'lib/zip.js/zip',
             'lib/zip.js/zip-fs',

             'polyfills/FileWriter',
             'polyfills/IndexedDB-javascript',

             'handshake/index',
             'handshake/PubNub',
             'handshake/simpleSignaling',

             'transport/index',
             'transport/host',
             'transport/peer'
             ]);