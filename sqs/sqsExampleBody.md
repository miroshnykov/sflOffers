# SQS to sync Mysql and Redis 
>  offers  

    > insert
    
        {
          "sqs_message": {
            "_comments": "ex# offer handling insert",
            "type": "offer",
            "offerId": 3333,
            "action": "insert",
            "body": "{\"offerId\":3333,\"name\":\"First offer\",\"advertiser\":\"sws\",\"status\":\"inactive\",\"landingPageId\":2,\"landingPageUrl\":\"adserge.com\"}"
          }
        }
    
    > delete
    
        {
          "sqs_message": {
            "_comments": "ex# offer handling delete",
            "type": "offer",
            "offerId": 3333,
            "action": "delete",
            "body": ""
          }
        }   
        
>  campaigns

    > insert
    
        {
          "sqs_message": {
            "_comments": "ex# campaign handling insert",
            "type": "campaigns",
            "campaignId": 666,
            "action": "insert",
            "body": "{ \"campaignId\": 666,  \"offerId\": 1,  \"affiliate_id\": 143688,  \"rules\": \"soon will define \"}"
          }
        }
        
    > delete    
    
        {
          "sqs_message": {
            "_comments": "ex# campaign handling delete",
            "type": "campaigns",
            "campaignId": 666,
            "action": "delete",
            "body": ""
          }
        }    