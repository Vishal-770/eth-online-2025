import { createThirdwebClient } from "thirdweb";

const client = createThirdwebClient({
  // use clientId for client side usage
  clientId: process.env.NEXT_PUBLIC_THIRD_WEB_CLIENT_ID!,
  // use secretKey for server side usage
  secretKey: process.env.NEXT_PUBLIC_THIRD_WEB_SECRET!, // replace this with full secret key
});
export default client;
