import { request, gql } from 'graphql-request'

const toFloat = (x) => Number(x) / 1e18;

const fixToken = (x) => {
  var y = x.replace('fa://0', 'RMRK')
            .replace('fa%3A%2F%2F0', 'RMRK')
            .replace('fa://1', 'ARIS')
            .replace('fa%3A%2F%2F1', 'ARIS')
            .replace('fa://2', 'QTZ')
            .replace('fa%3A%2F%2F2', 'QTZ')
            .replace('fa://3', 'MOVRZ')
            .replace('fa%3A%2F%2F3', 'MOVR')
            .replace('fa://4', 'HKO')
            .replace('fa%3A%2F%2F4', 'HKO')
            .replace('fa://5', 'CSM')
            .replace('fa%3A%2F%2F5', 'CSM')
            .replace('lc://13', 'LCDOT')
            .replace('sa://0', 'taiKSM')
            .replace('sa%3A%2F%2F0', 'taiKSM')
            .replace('lc%3A%2F%2F13', 'LCDOT')
  return y;
}

// Helper to sort JSON object based on 'prop'
const GetSortOrder = (prop) => {
  return function(a, b) {
      if (a[prop] > b[prop]) {
          return -1;
      } else if (a[prop] < b[prop]) {
          return 1;
      }
      return 0;
  }
}


const main = async () => {

  const networkName: string = "Karura";
  var api_dex;

  switch(networkName) {
    case "Acala": {
      api_dex = "https://api.subquery.network/sq/AcalaNetwork/acala-dex";
      break;
    }
    default: {
      api_dex = "https://api.subquery.network/sq/AcalaNetwork/karura-dex";
      break;
    }
  }

  // Get swap price for any two tokens
  const QUERY_price = gql`query PriceQ($token0: String!, $token1: String!) {swaps (
    filter: {token0Id: {in: [$token0, $token1]}, token1Id: {in: [$token0, $token1]}}, orderBy: TIMESTAMP_DESC, first: 1) {
        nodes { token0Id token1Id price0 price1}}}`;
  const price_rd = await request(api_dex, QUERY_price, { token0: "KSM", token1: "KUSD" });
  var price = price_rd.swaps.nodes;
  console.log("price: " + JSON.stringify(price));

  // Get pool stats
  const QUERY_pool = gql`query { pools { nodes { id feeRate txCount tradeVolumeUSD totalTVL }}}`;
  const pool_tvl = await request(api_dex, QUERY_pool, { });
  var pools_data = pool_tvl.pools.nodes

  console.log("pools: " + JSON.stringify(pools_data));
  for (var i = 0; i < pools_data.length; i++) {
    pools_data[i].id = fixToken(pools_data[i].id);
    pools_data[i].feeRate = Number(pools_data[i].feeRate);
    pools_data[i].tradeVolumeUSD = toFloat(pools_data[i].tradeVolumeUSD);
    pools_data[i].totalTVL = toFloat(pools_data[i].totalTVL);
  }

  var pools_sorted = pools_data.sort(GetSortOrder("totalTVL"));
  let cumsum_pool = 0;
  const cum_pool_TVL = pools_sorted.map(({id, tradeVolumeUSD, totalTVL}) =>
    ({id, tradeVolumeUSD, totalTVL, Cum_TVL: cumsum_pool += totalTVL }));
  console.log("cum_pool_TVL: " + JSON.stringify(cum_pool_TVL));

  // Get dex stats
  const QUERY_tvl = gql`query MyTokenQ { tokens (filter: {tvl: {greaterThan: "0"}})
    { nodes { id amount tradeVolumeUSD tvl price decimals }}}`;
  const all_dex_tvl = await request(api_dex, QUERY_tvl, { });
  var tvl_data = all_dex_tvl.tokens.nodes

  for (var i = 0; i < tvl_data.length; i++) {
    tvl_data[i].id = fixToken(tvl_data[i].id);
    tvl_data[i].tradeVolumeUSD = toFloat(tvl_data[i].tradeVolumeUSD);
    tvl_data[i].tvl = toFloat(tvl_data[i].tvl);
    tvl_data[i].price = toFloat(tvl_data[i].price);
    tvl_data[i].adj = 10**tvl_data[i].decimals;
    tvl_data[i].amount = Number(tvl_data[i].amount) / tvl_data[i].adj;
  }

  var dex_sorted = tvl_data.sort(GetSortOrder("tvl"));
  console.log("tvl_data:" + JSON.stringify(tvl_data));
  let cumsum = 0;
  const cum_dex_TVL = dex_sorted.map(({id, tradeVolumeUSD, tvl}) =>
    ({id, tradeVolumeUSD, tvl, Cum_TVL: cumsum += tvl }));
  console.log("cum_dex_TVL: " + JSON.stringify(cum_dex_TVL));


  const creature = {
    genus: 'Callithrix',
    species: 'Jacchus'
  }
  const {genus, species} = creature
  console.log(`genus is ${genus}`)
  console.log(`species is ${species}`)

}
main()
