var apiai = require("apiai-proxy");
var app = apiai("f0dbb67cca114362a7867227481abe0e");

// Function which returns speech from api.ai

// var getRes = function(query)
// {
//  	var request = app.textRequest(query, {
//  		sessionId: "daskljdkjhasldas"
//  	});

// 	const responseFromAPI = new Promise(
//  		function (resolve, reject)
//  		{
// 			request.on("error", function(error)
// 			{
//  				reject(error);
// 			});

// 			request.on("response", function(response)
// 			{
//  				resolve(response.result.fulfillment.speech);
// 			});
// 		});

// 		request.end()
// 	return responseFromAPI;
// };

// getRes("hii").then(function(res){console.log(res)});

var options = {    
    proxyHost: '192.168.90.179',
    proxyPort: 75,
    sessionId: "daskljdkjhasldas"
};
 
var request = app.textRequest('hii', options);
 
request.on('response', function(response) {
    console.log(response);
});
 
request.on('error', function(error) {
    console.log(error);
});
 
request.end()
// module.exports = {getRes}