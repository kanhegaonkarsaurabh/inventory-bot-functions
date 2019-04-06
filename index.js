const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');

// initialise DB connection
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'ws://hackxx-b5b0f.firebaseio.com/',
});

process.env.DEBUG = 'dialogflow:debug';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  // IMPORTANT: function that actually checks the inventory
  function checkInventoryItem(agent) {
    const swag = agent.parameters.swag;

    agent.add("Here's the information: ");

    return admin.database().ref('inventory').once('value').then((snapshot) => {
      if (swag === 'tshirts') {
        let size = agent.parameters.size;
        if (size && size.length > 0) {
          const count = snapshot.child(`${swag}/${size}`).val();
          console.log('db read: ' + count);
          agent.add('The count of ' + size + ' tshirts is: ' + count);
        }  
      } else if (swag === 'bottles') {
        let company = agent.parameters.company;
        if (company && company.length > 0) {
          const count = snapshot.child(`${swag}/${company}`).val();
          agent.add('The count of ' + company + ' bottles is: ' + count);
        }
      }

      return null;    // empty response but updated http response
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('checkInventory', checkInventoryItem);
  agent.handleRequest(intentMap);
});