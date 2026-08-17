# Production checkout migration

The live project was inspected on 2026-08-17. `orders` and `users` exist and
use non-UUID text IDs. The following did **not** exist: `user_addresses`,
`order_items`, `orders.address_id`, `orders.address`,
`orders.delivery_address_id`, and `orders.shipping_address_id`.

Apply `20260817_order_checkout.sql` in the SQL Editor of Supabase project
`xkooguvxhhempfpcmrjd` as a database owner. It creates the single supported
relationship:

`user_addresses.id (TEXT) -> orders.address_id (TEXT)`

It also creates `order_items` and sends PostgREST a schema-reload notification.
Then configure the deployed backend with a real service credential named either
`SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET`. Never put that value in a
Vite environment variable or frontend build.

After deploying the backend, run:

```sh
npm run verify:order-schema
```

It must report all three tables as `OK` before testing Place Order.
