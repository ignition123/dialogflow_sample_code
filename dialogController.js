const dialogflow = require('dialogflow');
  
const LANGUAGE_CODE = 'en-US' 

class DialogFlow
{
  constructor (projectId)
  {
    this.ProjectID = projectId

    let config = {
      keyFilename: 'religarecustomerservice-b8baaeabcc8d.json'
    }
  
    this.sessionClient = new dialogflow.SessionsClient(config)
  }

  async sendTextMessageToDialogFlow(textMessage, sessionId)
  {
    // Define session path
    const sessionPath = this.sessionClient.sessionPath(this.ProjectID, sessionId);
    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: textMessage,
          languageCode: LANGUAGE_CODE
        }
      }
    }

    try
    {
      let responses = await this.sessionClient.detectIntent(request)  
      return responses;
    }
    catch(err)
    {
      console.error('DialogFlow.sendTextMessageToDialogFlow ERROR:', err);
      throw err
    }
  }
}

exports.DialogFlow = DialogFlow;