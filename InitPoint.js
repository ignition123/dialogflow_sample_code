const config = require('../../Config/config');
var dialogflow = require("dialogflow");
const http = require("http");
const redis = require("redis");

let subscriber = redis.createClient({host:config.redis.host,port:config.redis.port});

subscriber.subscribe("dialogFlow");

subscriber.on("message", async function(channel, message) 
{
	var object = JSON.parse(message);
	var ip = Buffer.from(object.sessionId, 'hex').toString();
	var payload = object.payload;

	if(
		payload == null 
		|| 
		payload.requestType === undefined 
		|| 
		payload.requestType === null
	)
	{
		return;
	}

	await runPayload(payload,ip);
});

var randomNames = [
	"Diana",
	"Bruce",
	"Peter",
	"Tony",
	"Natasha",
	"Ben"
];

async function runPayload(payload, ip)
{
	try
	{
		switch(payload.requestType)
		{
			case "MF_FUNDS_DETAILS":
				await getmfFundDetails(payload, ip);
				break;
			default:
				websocketObj[ip].send(JSON.stringify(
					{
						speechMsg:`Sorry, I am not able to understand, please repeat the question again...`,
						status:true,
						botName:websocketObj[ip].botName,
						datetime: new Date().toDateString(),
						msg:`Sorry, I am not able to understand, please repeat the question again...`
					}
				));
		}
	}
	catch(e)
	{
		console.log(e);
	}
}

async function checkMFCurerntOrders(ip)
{
	try
	{
		var dataRes = await config.db.collection("place_order").aggregate([
			{
				$match:{
					Clid:"KK4629"
				}
			},
			{
				$group:{
					_id:"$tranId",
					Clid:{
						$first:"$Clid"
					},
					schemeName:{
						$first:"$schemeName"
					},
					schemeID:{
						$first:"$schemeID"
					},
					orderDate:{
						$first:"$orderDate"
					}
				}
			},
			{
				$sort:{
					orderDate:-1
				}
			},
			{
				$limit:1
			}
		]).toArray();

		if(dataRes.length === 0)
		{
			var speechMsg = `Hi, krishan, I have seen you have not placed any order in mutual funds, 
			here are some top 10 EQUITY funds`;
		}
		else
		{
			var speechMsg = `Hi krishan, I have seen you have placed an order in ${dataRes[0].schemeName} here are some top 10 EQUITY funds`;
		}

		var dataRes = await config.db.collection("MF_CMOTS_MFCAT").aggregate(
		[
		    {
	            $match:{
                   SEBI_CATG_NAME:"EQUITY"
	            }
		    },
		    {
	            $lookup:{
                    from: 'MF_CMOTS_return',
                    localField: 'MF_SCHCODE',
                    foreignField: 'MF_SCHCODE',
                    as: 'returnData'
	            }
		    },
		    {
	            $unwind:"$returnData"
		    },
		    {
	            $project:{
	            	_id:false,
	            	MF_SCHNAME:true,
                    "1MONTH":"$returnData.1MONTH",
                    "3MONTH":"$returnData.3MONTH",
                    "6MONTH":"$returnData.6MONTH",
                    "1YEAR":"$returnData.1YEAR",
                    "3YEAR":"$returnData.3YEAR",
                    "5YEAR":"$returnData.5YEAR"
	            }
		    },
		    {
	            $sort:{
                  	"3YEAR":-1  
	            }
		    },
		    {
	            $limit:10
		    }
		]).toArray();

		if(dataRes.length > 0)
		{
			var tableString = `
				<b>Here are the top 10 data of EQUITY FUND as per 3 year returns</b>
				<br/>
				<table class="table" style='float:left;clear:left;width:400px;font-size:12px;'>
					<thead>
						<tr style="float:left;">
							<th style="width:150px;">SCHEMENAME</th>
							<th style="width:40px;">1MONTH</th>
							<th style="width:40px;">3MONTH</th>
							<th style="width:40px;">6MONTH</th>
							<th style="width:40px;">1YEAR</th>
							<th style="width:40px;">3YEAR</th>
							<th style="width:40px;">5YEAR</th>
						</tr>
					</thead>
				<tbody>
			`;

			for(var index in dataRes)
			{
				dataRes[index]['1MONTH'] = dataRes[index]['1MONTH'].toFixed(4);
				dataRes[index]['3MONTH'] = dataRes[index]['3MONTH'].toFixed(4);
				dataRes[index]['6MONTH'] = dataRes[index]['6MONTH'].toFixed(4);
				dataRes[index]['1YEAR'] = dataRes[index]['1YEAR'].toFixed(4);
				dataRes[index]['3YEAR'] = dataRes[index]['3YEAR'].toFixed(4);
				dataRes[index]['5YEAR'] = dataRes[index]['5YEAR'].toFixed(4);

				tableString += `
					<tr style="float:left;clear:left;">
						<td style="width:150px;" scope="row">${dataRes[index].MF_SCHNAME}</td>
						<td style="width:40px;">${dataRes[index]['1MONTH']}</td>
						<td style="width:40px;">${dataRes[index]['3MONTH']}</td>
						<td style="width:40px;">${dataRes[index]['6MONTH']}</td>
						<td style="width:40px;">${dataRes[index]['1YEAR']}</td>
						<td style="width:40px;">${dataRes[index]['3YEAR']}</td>
						<td style="width:40px;">${dataRes[index]['5YEAR']}</td>
					</tr>
				`;
			}

			tableString += `
					</tbody>
				</table>
				</br>
			`;

			websocketObj[ip].send(JSON.stringify(
				{
					speechMsg:speechMsg,
					status:true,
					botName:websocketObj[ip].botName,
					datetime: new Date().toDateString(),
					msg:tableString
				}
			));	
		}	
	}
	catch(e)
	{
		console.log(e);
	}
}

async function getmfFundDetails(payload, ip)
{
	try
	{
		var dataRes = await config.db.collection("MF_CMOTS_MFCAT").aggregate(
		[
		    {
	            $match:{
                   $text: { $search: payload.categoryName } 
	            }
		    },
		    {
	            $lookup:{
                    from: 'MF_CMOTS_return',
                    localField: 'MF_SCHCODE',
                    foreignField: 'MF_SCHCODE',
                    as: 'returnData'
	            }
		    },
		    {
	            $unwind:"$returnData"
		    },
		    {
	            $project:{
	            	_id:false,
	            	MF_SCHNAME:true,
                    "1MONTH":"$returnData.1MONTH",
                    "3MONTH":"$returnData.3MONTH",
                    "6MONTH":"$returnData.6MONTH",
                    "1YEAR":"$returnData.1YEAR",
                    "3YEAR":"$returnData.3YEAR",
                    "5YEAR":"$returnData.5YEAR"
	            }
		    },
		    {
	            $sort:{
                  	"3YEAR":-1  
	            }
		    },
		    {
	            $limit:10
		    }
		]).toArray();

		if(dataRes.length === 0)
		{
			websocketObj[ip].send(JSON.stringify(
				{
					speechMsg:`Sorry, I am not able to fetch details for ${payload.categoryName}`,
					status:true,
					botName:websocketObj[ip].botName,
					datetime: new Date().toDateString(),
					msg:`Sorry, I am not able to fetch details for ${payload.categoryName}`
				}
			));
		}
		else
		{
			var tableString = `
				<b>Here are the top 10 data of ${payload.categoryName} as per 3 year returns</b>
				<br/>
				<table class="table" style='float:left;clear:left;width:400px;font-size:12px;'>
					<thead>
						<tr style="float:left;">
							<th style="width:150px;">SCHEMENAME</th>
							<th style="width:40px;">1MONTH</th>
							<th style="width:40px;">3MONTH</th>
							<th style="width:40px;">6MONTH</th>
							<th style="width:40px;">1YEAR</th>
							<th style="width:40px;">3YEAR</th>
							<th style="width:40px;">5YEAR</th>
						</tr>
					</thead>
				<tbody>
			`;

			for(var index in dataRes)
			{
				dataRes[index]['1MONTH'] = dataRes[index]['1MONTH'].toFixed(4);
				dataRes[index]['3MONTH'] = dataRes[index]['3MONTH'].toFixed(4);
				dataRes[index]['6MONTH'] = dataRes[index]['6MONTH'].toFixed(4);
				dataRes[index]['1YEAR'] = dataRes[index]['1YEAR'].toFixed(4);
				dataRes[index]['3YEAR'] = dataRes[index]['3YEAR'].toFixed(4);
				dataRes[index]['5YEAR'] = dataRes[index]['5YEAR'].toFixed(4);

				tableString += `
					<tr style="float:left;clear:left;">
						<td style="width:150px;" scope="row">${dataRes[index].MF_SCHNAME}</td>
						<td style="width:40px;">${dataRes[index]['1MONTH']}</td>
						<td style="width:40px;">${dataRes[index]['3MONTH']}</td>
						<td style="width:40px;">${dataRes[index]['6MONTH']}</td>
						<td style="width:40px;">${dataRes[index]['1YEAR']}</td>
						<td style="width:40px;">${dataRes[index]['3YEAR']}</td>
						<td style="width:40px;">${dataRes[index]['5YEAR']}</td>
					</tr>
				`;
			}

			tableString += `
					</tbody>
				</table>
				</br>
			`;
		}

		websocketObj[ip].send(JSON.stringify(
			{
				speechMsg:`Here are the top 10 data of ${payload.categoryName} as per 3 year returns`,
				status:true,
				botName:websocketObj[ip].botName,
				datetime: new Date().toDateString(),
				msg:tableString
			}
		));
	}
	catch(e)
	{
		console.log(e);
	}
}

async function whenAvailable(object,callback)
{
	var interval = 5; // ms
    setTimeout(function()
    {
    	if(
    		object !== undefined 
    		&& 
    		object !== null 
    		&& 
    		object['message'] !== undefined 
    		&& object['message'] === "payload"
    	)
		{
		  if (object != null)
          {
            callback({status:true,payload:object});
          }
          else
          {
            setTimeout(arguments.callee, interval);
          }
		}
		else
		{
			callback({status:true,payload:null});
		}
          
    }, interval);  
}

async function init(input,ip)
{
	try
	{
		var sessionKey = Buffer.from(ip, 'utf8').toString('hex');

		switch(input.MESSAGE_TYPE)
		{
			case "INITIATE_BOT":
				var name = randomNames[Math.floor(Math.random() * 5) + 1];
			    websocketObj[ip].botName = name;
				websocketObj[ip].send(JSON.stringify(
					{
						speechMsg:`Welcome to religare support, My name is ${websocketObj[ip].botName} how can I help you...`,
						status:true,
						botName:websocketObj[ip].botName,
						datetime: new Date().toDateString(),
						msg:`Welcome to religare support, My name is ${websocketObj[ip].botName} how can I help you...`
					}
				));
				break;
			case "DIALOGFLOW_MSG":
				var res = await getRes(input.msg, sessionKey);

				var fullFillMentObj = await res[0]['queryResult']['fulfillmentMessages'][0];

				if(fullFillMentObj === undefined)
				{
					websocketObj[ip].send(JSON.stringify(
						{
							speechMsg:"Sorry, I am not able to understand, please repeat the question again...",
							status:false,
							botName:websocketObj[ip].botName,
							datetime: new Date().toDateString(),
							msg:"Sorry, I am not able to understand, please repeat the question again..."
						}
					));

					return;
				}

				whenAvailable(fullFillMentObj,async function(payload)
				{
					var parameters = await res[0]['queryResult']['parameters'];

					var fulfillmentText = await res[0]['queryResult']['fulfillmentText'];

					if(fulfillmentText !== "")
					{
						websocketObj[ip].send(JSON.stringify(
							{
								speechMsg:`${fulfillmentText}`,
								status:true,
								botName:websocketObj[ip].botName,
								datetime: new Date().toDateString(),
								msg:`${fulfillmentText}`
							}
						));
					}
				});

				break;	
			case "OWN_CUSTOM_MSG":
				if(input.queryType === "SUGGEST_MF_CURRENT_ORDERS")
				{
					await checkMFCurerntOrders(ip);
				}
				break;
			default:
				websocketObj[ip].send(JSON.stringify(
					{
						speechMsg:"Sorry, I am not able to understand, please repeat the question again...",
						status:false,
						botName:websocketObj[ip].botName,
						datetime: new Date().toDateString(),
						msg:"Sorry, I am not able to understand, please repeat the question again..."
					}
				));
		}
	}
	catch(e)
	{
		console.log(e);
	}
}

async function getRes(query, sessionKey)
{
	return new Promise((resolve, reject)=>{

		var request = {
			msg:query,
			projectId:"religarecustomerservice",
			sessionId:sessionKey
		};

		var http_options = {
		  host: "192.168.90.179",
		  port:75,
		  path: "http://172.104.55.76:8080/dialogflow",
		  rejectUnauthorized: false,
		  requestCert: true,
	  	  agent: false,
		  method: 'POST',
		  headers:
		  {
		    'Content-Type': 'application/json'
		  }
		};

		var req = http.request(http_options, (res) => {

		  var body = "";

		  res.on('data', (chunk) => {
		  	body += chunk;  
		  });

		  res.on('end', () => {
		  	body = JSON.parse(body);
	    	resolve(body);
		  });

		});

		req.on('error', (e) => {
		  console.log(e.message);
		});

		req.end(JSON.stringify(request));
	})
}

exports.init = init;