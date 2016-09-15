var express = require('express');
var bodyParser = require('body-parser');
var spawn = require('child_process').spawn;
var natural = require('natural');
tokenizer = new natural.WordTokenizer();
var shrtntodise = require("./modules/sympt2dise.js");
var app = express(),data1 = [1,2,3,4,5,6,7,8,9];
var request = require('request');
var options = {
  url: 'https://api.infermedica.com/v2/diagnosis',
  method:'POST',
  json:true,
  headers: {
  app_id:'f1308345',
  app_key:'abb713ecd3ddecf6106ecf9118bfacde'
  },
  body:{}
  };
  var evi_format = {
  "id": "",
  "choice_id": "present"
  };

  var diagnosis_format = {
    "sex": "",
    "age": "",
    "evidence": []
  };
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.OPENSHIFT_NODEJS_PORT || 8080));
app.set('ip',(process.env.MEDBOT_SERVICE_HOST || '127.0.0.1'));
var python_name = 'python';
if(process.env.MEDBOT_SERVICE_HOST)
{
  python_name='/var/lib/openshift/57c2ff777628e1c6210000af/app-root/data/bin/python';
}
app.use(express.static(__dirname +'/CSS'));
app.use(express.static(__dirname +'/JS'));
app.use(express.static(__dirname +'/SCSS'));
app.use(express.static(__dirname +'/images'));
app.post('/query',function (req,res) {

  diagnosis_format = shrtntodise.restoreSessionVariables('staticuser');
  if(!diagnosis_format)
  diagnosis_format= {
    "sex": "",
    "age": "",
    "evidence": []
  };
  console.log("Message from client recieved and says ",req.body.key);
  var symlist = tokenizer.tokenize(req.body.key);
  if(!diagnosis_format['sex'])
  diagnosis_format['sex']='male';
  if(!diagnosis_format['age'])
  diagnosis_format['age']='20';
  console.log(symlist);
  shrtntodise.isSymtomFilter(symlist,function(err,symlist){
    if(err)
    {
      console.log(err);
    }
    else {
      console.log(symlist);
      for(var i=0;i<symlist.length;i++)
      {
        var new_evi_form = evi_format;
        new_evi_form.id=symlist[i];
        diagnosis_format.evidence.push(new_evi_form);
      }
      options.body=diagnosis_format;
      request.post(options,function(err,responce,body){
        if(err)
        {
          console.log(err);
        }
        if(body)
        {
          console.log("Body says",body)
          res.json({key:body.question.text});
        }
        else {
          res.json({key:"Some error occured while connecting to brain"});
        }

      });
      shrtntodise.updateSessionVariables('staticuser',diagnosis_format);
    }

  });


});
app.get('/',function(req,res){
	res.sendFile(__dirname+'/views/index.html');
});

app.listen(app.get('port'), app.get('ip'), function() {
  console.log('Node app is running on port', app.get('port'),'On ip ',app.get('ip'));
});
/*

shrtntodise.shortdowntodiseaselist(symlist,function(err,disList){
  if(err)
  {
    console.log(err);
  }
  else {
  console.log("Got you"+disList);
  }

});

---------------------
var py    = spawn(python_name, ['nlpserver.py']);
var nlpdata='';
py.stdout.on('data', function(data){
  nlpdata += data.toString();
});
py.stdout.on('end', function(){
  console.log('Sum of numbers=',nlpdata);
  res.json({key:nlpdata+disList});
  console.log(req.body.key);
});
py.stdin.write(req.body.key);
py.stdin.end();*/
