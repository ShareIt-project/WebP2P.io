QUnit.log(function(details)
{
  if(details.result)
    console.log("Log: ", details.message);
  else
    console.warn("Log: ", details.message);
});

QUnit.config.testTimeout = 40000;
