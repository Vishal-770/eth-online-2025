export type Provider = {
  id: string;
  description: string;
  exampleData?: unknown;
};

export type Providers = {
  [key: string]: Provider;
};
export const providers: Providers = {
  Uber: {
    id: "03ebe23d-29e1-4738-a98e-53673436e452",
    description: "Total Uber Rides",
  },

  Youtube: {
    id: "199896d3-e485-4edf-862d-77268f8b6a39",
    description: "Total Youtube Subscribers",
  },
  Twitter: {
    id: "71901e6a-0548-414f-affb-c60d66e9648f",
    description: "Total Twitter Followers",
  },
  Github: {
    id: "8573efb4-4529-47d3-80da-eaa7384dac19",
    description: "Total Commit Contributions Last Year",
  },
  Github1: {
    id: "acb0d5eb-6dd9-4912-97bb-6dd0a0bf4f43",
    description: "Total GitHub Followers",
  },
  MonkeyType: {
    id: "c9e3c386-a110-4c9c-b124-cf2f9def116f",
    description: "60 Second Typing Test Highest WPM",
  },
  Instagram: {
    id: "7729ae3e-179c-4ac8-8c5d-4bcd909c864d",
    description: "Total Instagram Followers",
  },
  LeetCode: {
    id: "29162ff4-c52c-4275-829e-f8eaba1e7b99",
    description: "Total Questions Solved",
  },
  GitHub2: {
    id: "5622b4ea-b953-4cd9-a377-409bb7ed5ec5",
    description: "Total Github Repositories",
  },
  AadharIdentity: {
    id: "5e1302ca-a3dd-4ef8-bc25-24fcc97dc801",
    description: "Is Indian",
  },
  Neflix: {
    id: "789c875f-8348-4a5c-873a-4aa02146b1e0",
    description: "subscription plan",
  },
  Zomato: {
    id: "398683a3-f48e-4e40-9b54-cf9b5c044417",
    description: "Total Zomato Orders",
    exampleData: {
      identifier:
        "0x67ea7453933ceb4263d931dbe188c716fb9dc699ac62bc446ab22548f5b6c076",
      claimData: {
        provider: "http",
        parameters:
          '{"additionalClientOptions":{},"body":"","geoLocation":"IN","headers":{"Sec-Fetch-Mode":"same-origin","Sec-Fetch-Site":"same-origin","User-Agent":"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36"},"method":"GET","paramValues":{"URL_PARAMS_1":"/users/vishal-325194085/reviews","URL_PARAMS_GRD":"1","username":"Vishal | Zomato"},"responseMatches":[{"invert":false,"type":"contains","value":"\\"pageTitle\\":\\"{{username}}\\""}],"responseRedactions":[{"jsonPath":"$.page_info.pageTitle","regex":"\\"pageTitle\\":\\"(.*)\\"","xPath":""}],"url":"https://www.zomato.com/webroutes/getPage?page_url={{URL_PARAMS_1}}&location=&isMobile={{URL_PARAMS_GRD}}"}',
        owner: "0x591ea6ae21614a1d3118e8afb2806a762f807e99",
        timestampS: 1760867775,
        context:
          '{"contextAddress":"0x0","contextMessage":"sample context","extractedParameters":{"URL_PARAMS_1":"/users/vishal-325194085/reviews","URL_PARAMS_GRD":"1","username":"Vishal | Zomato"},"providerHash":"0x7c347d982097c1907950adb87239722c922c402ef54487bc5a73384664d4b116"}',
        identifier:
          "0x67ea7453933ceb4263d931dbe188c716fb9dc699ac62bc446ab22548f5b6c076",
        epoch: 1,
      },
      signatures: [
        "0x9dd1ebb2807049bab7ae792e6e1835bf0c7656c7072e05063926f158a1eb7e616ba53d7fd20dc1bef49ff9f7d5246a63869e8870a2c5f58db508e53d433a31e21b",
      ],
      witnesses: [
        {
          id: "0x244897572368eadf65bfbc5aec98d8e5443a9072",
          url: "wss://attestor.reclaimprotocol.org:444/ws",
        },
      ],
      publicData: {
        userid: "vishal-325194085",
        orders: [
          {
            orderId: 6465797652,
            orderDate: "December 25, 2024 at 11:11 AM",
            totalCost: "₹468",
            dishString: "1 x Chicken Xl Biryani",
            deliveryDetails: {
              deliveryAddress:
                "308/1 icf North colony, ICF Stadium, Ayanavaram Road,Gandhi Nagar,Ayanavaram,Chennai",
              deliveryStatus: 4,
              deliveryMessage:
                "This order was delivered successfully. Hope you enjoyed your meal!",
              deliveryLabel: "Delivered",
            },
            restaurantURL:
              "https://www.zomato.com/chennai/ambur-star-briyani-anna-nagar-east",
          },
          {
            orderId: 5440992319,
            orderDate: "December 25, 2023 at 11:46 AM",
            totalCost: "₹185",
            dishString: "1 x Chicken Tikka 6 Pc (Boneless)",
            deliveryDetails: {
              deliveryAddress:
                "308/1 icf North colony, ICF Stadium, Ayanavaram Road,Gandhi Nagar,Ayanavaram,Chennai",
              deliveryStatus: 4,
              deliveryMessage:
                "This order was delivered successfully. Hope you enjoyed your meal!",
              deliveryLabel: "Delivered",
            },
            restaurantURL:
              "https://www.zomato.com/chennai/yaa-mohaideen-biryani-perambur",
          },
        ],
      },
    },
  },

  LinkedIn: {
    id: "0b68fab7-962e-45bb-8c34-475f12a854ba",
    description: "Total LinkedIn Followers",
  },
  AadharIdentity1: {
    id: "5e1302ca-a3dd-4ef8-bc25-24fcc97dc800",
    description: "Date of Birth",
  },
  Amazon: {
    id: "23aafac5-dca7-4030-98b0-e7ae82156815",
    description: "has Prime Membership",
  },
  Amazon1: {
    id: "867fc359-e958-410a-b08a-70b066d5d240",
    description: "Total Amazon Orders",
  },
};
