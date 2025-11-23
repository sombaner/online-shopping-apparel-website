# Data Model – Foundational Apparel E‑Commerce Platform

## Conventions
- Snake_case for DB columns; camelCase in application layer.
- UUID v4 primary keys unless otherwise noted.
- Monetary values stored as integer cents (amount_cents) with currency_code='USD'.
- Soft delete uses `deleted_at` nullable timestamp where needed.

## Entities & Fields
### users
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | pk | |
| email | varchar(255) | unique, not null | lowercased |
| password_hash | varchar(255) | not null | Argon2id recommended |
| first_name | varchar(100) | not null | |
| last_name | varchar(100) | not null | |
| contact_number | varchar(30) | nullable | E.164 validation |
| email_verified_at | timestamp | nullable | |
| status | enum(active,inactive,locked) | default active | |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |
| deleted_at | timestamp | nullable | soft delete |

### roles
| Field | Type | Constraints |
| id | uuid | pk |
| name | varchar(50) | unique |

### permissions
| Field | Type | Constraints |
| id | uuid | pk |
| code | varchar(80) | unique |
| description | text | | 

### role_permissions (join)
| role_id | permission_id | composite pk |

### user_roles (join)
| user_id | role_id | composite pk |

### addresses
| Field | Type | Constraints |
| id | uuid | pk |
| user_id | uuid | fk→users.id | cascade delete |
| line1 | varchar(255) | not null |
| line2 | varchar(255) | nullable |
| city | varchar(120) | not null |
| state | varchar(60) | not null |
| zip | varchar(15) | not null |
| country | char(2) | not null default 'US' |
| is_default | boolean | default false |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### categories
| Field | Type | Constraints |
| id | uuid | pk |
| parent_id | uuid | fk→categories.id nullable |
| name | varchar(120) | not null |
| status | enum(active,inactive) | default active |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### products
| Field | Type | Constraints |
| id | uuid | pk |
| category_id | uuid | fk→categories.id | |
| sku | varchar(64) | unique not null | variant-level if no variants table |
| title | varchar(255) | not null |
| description | text | not null |
| base_price_cents | int | not null |
| status | enum(active,inactive) | default active |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### product_images
| Field | Type | Constraints |
| id | uuid | pk |
| product_id | uuid | fk→products.id |
| sort_order | int | default 0 |
| path | varchar(255) | not null | static placeholder path |
| alt_text | varchar(255) | nullable |

### inventory_items
| Field | Type | Constraints |
| id | uuid | pk |
| product_id | uuid | fk→products.id |
| size | varchar(20) | not null |
| color | varchar(40) | not null |
| quantity_available | int | not null |
| sku_variant | varchar(80) | unique not null | product sku + size + color |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### wishlists
| id | uuid | pk |
| user_id | uuid | fk→users.id unique | one active wishlist per user |
| created_at | timestamp | |

### wishlist_items
| wishlist_id | uuid | fk→wishlists.id | pk part |
| product_id | uuid | fk→products.id | pk part |
| added_at | timestamp | not null |

### carts
| id | uuid | pk |
| user_id | uuid | fk→users.id unique | merge visitor temp cart after registration |
| created_at | timestamp | |
| updated_at | timestamp | |

### cart_items
| cart_id | uuid | fk→carts.id | pk part |
| inventory_item_id | uuid | fk→inventory_items.id | pk part |
| quantity | int | not null |
| unit_price_cents | int | snapshot | not null |
| added_at | timestamp | not null |

### orders
| id | uuid | pk |
| user_id | uuid | fk→users.id |
| status | enum(open,confirmed,in_process,shipped,delivered,canceled) | default open |
| sub_total_cents | int | not null |
| shipping_cents | int | not null |
| tax_cents | int | not null |
| total_cents | int | not null |
| payment_status | enum(pending,paid,failed,refunded) | default pending |
| shipping_address_id | uuid | fk→addresses.id snapshot |
| billing_address_id | uuid | fk→addresses.id snapshot |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### order_lines
| order_id | uuid | fk→orders.id | pk part |
| inventory_item_id | uuid | fk→inventory_items.id | pk part |
| quantity | int | not null |
| unit_price_cents | int | not null |
| line_total_cents | int | not null |

### shipments
| id | uuid | pk |
| order_id | uuid | fk→orders.id unique |
| carrier | varchar(80) | nullable |
| tracking_id | varchar(120) | nullable |
| status | enum(preparing,shipped,delivered) | default preparing |
| shipped_at | timestamp | nullable |
| delivered_at | timestamp | nullable |

### payments
| id | uuid | pk |
| order_id | uuid | fk→orders.id unique |
| provider | varchar(40) | not null default 'stripe_stub' |
| provider_ref | varchar(120) | nullable |
| amount_cents | int | not null |
| currency_code | char(3) | not null default 'USD' |
| status | enum(authorized,captured,failed,refunded) | default authorized |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### reviews
| id | uuid | pk |
| user_id | uuid | fk→users.id |
| product_id | uuid | fk→products.id |
| rating | smallint | 1-5 constraint |
| body | text | not null |
| status | enum(pending,approved,rejected) | default pending |
| created_at | timestamp | not null |
| moderated_at | timestamp | nullable |

### cms_pages
| id | uuid | pk |
| slug | varchar(80) | unique |
| title | varchar(120) | not null |
| content | text | not null |
| status | enum(draft,published,archived) | default draft |
| updated_at | timestamp | not null |

### support_tickets
| id | uuid | pk |
| user_id | uuid | fk→users.id |
| subject | varchar(140) | not null |
| message | text | not null |
| status | enum(open,in_review,resolved) | default open |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

### notifications
| id | uuid | pk |
| user_id | uuid | fk→users.id |
| type | varchar(60) | not null |
| channel | enum(email,inapp) | not null |
| payload | json | not null |
| status | enum(pending,sent,failed) | default pending |
| attempts | int | default 0 |
| last_attempt_at | timestamp | nullable |

### audit_logs
| id | uuid | pk |
| actor_user_id | uuid | fk→users.id |
| action | varchar(120) | not null |
| target_type | varchar(80) | not null |
| target_id | uuid | nullable |
| metadata | json | nullable |
| created_at | timestamp | not null |

## Relationships Overview
- User 1—* Address
- User 1—1 Wishlist, Wishlist 1—* WishlistItems → Product
- User 1—1 Cart, Cart 1—* CartItems → InventoryItem → Product
- Product 1—* InventoryItems; Product 1—* ProductImages
- Order 1—* OrderLines referencing InventoryItem snapshots
- Order 1—1 Shipment; Order 1—1 Payment
- Product 1—* Reviews (approved filtered for public)
- Roles ↔ Permissions (many-to-many), Users ↔ Roles

## Invariants & Validation Rules
- total_cents = sub_total_cents + shipping_cents + tax_cents
- quantity_available >= 0 (enforced on updates) 
- Cannot create review unless user purchased product (order_lines exists for that user & product)
- status transitions: order open→confirmed→in_process→shipped→delivered or canceled from open/confirmed
- reviews.status only moves from pending→approved|rejected (no reversal except via audit action)

## Migration Strategy
- Maintain `migrations/` with incremental SQL (Knex) runnable on SQLite; keep dialect-compatible SQL for future Azure SQL (avoid vendor-specific features).

## Future Considerations
- Add discounts/promotions tables
- Add product attributes & indexing optimization for search
- Introduce event sourcing only if multi-service split occurs
