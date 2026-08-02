/**
 * Common Product Model — shared between Admin and User apps.
 * This file documents the canonical product schema used by the REST API.
 *
 * Admin has full CRUD access.
 * User App has read-only access via GET /products.
 */

/**
 * @typedef {Object} Product
 * @property {string}   id                  — Auto-generated unique ID (e.g. "prod_lk3abc_xy12")
 * @property {string}   name                — Product name (required)
 * @property {string}   brand               — Brand name
 * @property {string}   description         — Product description
 * @property {string}   category            — Category ID (foreign key)
 * @property {string}   subcategory         — Sub-category name (optional)
 * @property {string}   sku                 — Stock Keeping Unit code
 * @property {string}   barcode             — Barcode (optional)
 * @property {string}   unit                — Unit/size (e.g. "500g", "1L", "Pack")
 * @property {string}   variants            — Legacy comma-separated variant list
 * @property {Array}    variantList         — Structured variant array
 * @property {Array}    images              — Array of image URLs (first = main display)
 * @property {number}   mrp                 — Maximum Retail Price
 * @property {number}   price               — Selling/offer price
 * @property {number}   discountPercent     — Auto-calculated: ((mrp-price)/mrp)*100
 * @property {number}   stock               — Available stock quantity
 * @property {number}   lowStockAlert       — Alert threshold (default: 10)
 * @property {string}   status              — "published" | "draft" | "inactive" | "hidden"
 * @property {string}   availabilityStatus  — mirrors status
 * @property {Array}    pincodesAvailable   — Array of pincode strings; empty = available everywhere
 * @property {boolean}  featured            — Show in "Picked For You" section
 * @property {boolean}  bestSeller          — Best seller badge
 * @property {boolean}  newArrival          — New arrival badge
 * @property {boolean}  trending            — Trending badge
 * @property {boolean}  todayOffer          — Show in "Today's Deals" section
 * @property {string}   expiryDate          — Expiry date string (optional)
 * @property {string}   gst                 — GST percentage string (default: "5")
 * @property {string}   deliveryTime        — Estimated delivery time
 * @property {boolean}  cod                 — Cash on delivery available
 * @property {string}   specifications      — Additional product specifications
 * @property {number}   createdAt           — Unix timestamp ms
 * @property {number}   updatedAt           — Unix timestamp ms
 */

module.exports = {};
