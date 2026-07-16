import { z } from 'zod';

export const graphqlConfigSchema = z.object({
  endpoint: z.string().url(),
  queries: z.array(z.object({
    operationName: z.string(),
    type: z.enum(['query', 'mutation']),
    query: z.string(),
    variables: z.record(z.unknown()).optional(),
  })),
});

export type GraphQLConfig = z.infer<typeof graphqlConfigSchema>;

export const defaultConfig: GraphQLConfig = {
  endpoint: 'https://mudream.online/api/graphql',
  queries: [
    {
      operationName: 'GetMarketItems',
      type: 'query',
      query: `
        query GetMarketItems($page: Int, $limit: Int, $filters: MarketFilterInput) {
          market {
            items(page: $page, limit: $limit, filters: $filters) {
              id
              listingId
              name
              category
              rarity
              level
              ancient
              excellent
              excellentOptions
              socket
              socketCount
              luck
              skill
              price {
                zen
                dc
                wcoin
                jewel
              }
              seller {
                name
                id
              }
              imageUrl
              listedAt
            }
            total
            hasMore
          }
        }
      `,
      variables: {
        page: 1,
        limit: 50,
      },
    },
  ],
};
