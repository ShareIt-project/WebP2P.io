/**
 * @fileoverview Magic dependency loading. Taken from JsJaC library.
 * @author Stefan Strigler steve@zeank.in-berlin.de (JsJaC)
 * @author Jesús Leganés Combarro "Piranna" piranna@gmail.com (webp2p)
 */

var JSJaC =
{
  require: function(libraryName)
  {
    // inserting via DOM fails in Safari 2.0, so brute force approach
    document.write('<script type="text/javascript" src="'+libraryName+'"></script>');
  },

  load: function()
  {
    var includes =
    ['xmlextras',
     'jsextras',
     'crypt',
     'JSJaCConfig',
     'JSJaCConstants',
     'JSJaCCookie',
     'JSJaCJSON',
     'JSJaCJID',
     'JSJaCBuilder',
     'JSJaCPacket',
     'JSJaCError',
     'JSJaCKeys',
     'JSJaCConnection',
     'JSJaCHttpPollingConnection',
     'JSJaCHttpBindingConnection',
     'JSJaCConsoleLogger',
     'JSJaCFBApplication',
     'JSJaCWebSocketConnection'
     ];

    var scripts = document.getElementsByTagName("script");
    var path = './', i;
    for(i=0; i<scripts.length; i++)
    {
      var src = scripts.item(i).src
      if(src && src.match(/JSJaC\.js$/))
      {
        path = src.replace(/JSJaC.js$/,'');
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

if(typeof JSJaCConnection == 'undefined')
  JSJaC.load();