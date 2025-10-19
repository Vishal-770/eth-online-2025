export type Provider = {
  id: string;
  description: string;
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
    id: "03ebe23d-29e1-4738-a98e-53673436e452",
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
