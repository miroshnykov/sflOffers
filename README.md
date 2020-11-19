# SFL-OFFERS 
> publish recipe data to traffic server(sfl-core-engine)   

	docker build -t sfl-offers .
   	docker run -it -p 8091:8091 --rm --name sfl-offers-  sfl-offers
   	
   	
   	{
      "sqs_message": {
        "_comments": "ex# campaign handling insert",
        "type": "campaigns",
        "campaignId": 666,
        "action": "insert",
        "body": "{ \"campaignId\": 666,  \"offerId\": 1,  \"affiliate_id\": 143688,  \"rules\": \"soon will define \"}"
      }
    }