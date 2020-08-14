const express = require("express");
const bodyParser = require("body-parser");
const dialogObject = require("./dialogController.js");
const dialogFlow = new dialogObject.DialogFlow("religarecustomerservice");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/dialogflow',async function(req,res)
{
	console.log(req.body);

	var callback = await dialogFlow.sendTextMessageToDialogFlow(req.body.msg, req.body.sessionId);

	console.log(callback);

	res.send(callback);
});

app.listen(8080,function()
{
  console.log("Started on PORT 8080");
});